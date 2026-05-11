'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchComments, addComment } from '@/lib/api';
import { StaffProfile } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function CommentFeed({ 
  workflowId,
  currentStaff,
  workflowStatus
}: { 
  workflowId: string;
  currentStaff: StaffProfile;
  workflowStatus: string;
}) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', workflowId],
    queryFn: () => fetchComments(workflowId),
  });

  useEffect(() => {
    // Supabase real-time subscription for comments
    const channel = supabase
      .channel(`comments-${workflowId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workflow_comments',
          filter: `workflow_id=eq.${workflowId}`,
        },
        (payload) => {
          // Invalidate queries to fetch the newly inserted comment along with staff profile
          queryClient.invalidateQueries({ queryKey: ['comments', workflowId] });
          queryClient.invalidateQueries({ queryKey: ['workflows'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workflowId, queryClient]);

  const mutation = useMutation({
    mutationFn: (content: string) => addComment(workflowId, content, currentStaff.id, workflowStatus),
    onSuccess: () => {
      setNewComment('');
      // Invalidation is handled by the real-time subscription or could be optimistic here
      queryClient.invalidateQueries({ queryKey: ['comments', workflowId] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    mutation.mutate(newComment);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="flex flex-col gap-6 pb-6">
          {(!comments || comments.length === 0) ? (
            <div className="text-center text-sm text-slate-400 mt-10">
              No comments yet. Start the conversation.
            </div>
          ) : (
            comments.map(comment => {
              const isMe = comment.staff_id === currentStaff.id;
              const staff = comment.staff_profiles;
              
              return (
                <div key={comment.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="h-8 w-8 shrink-0 mt-1 ring-2 ring-white shadow-sm">
                    <AvatarImage src={staff?.avatar_url} />
                    <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-semibold">
                      {staff?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-baseline gap-2 mb-1 px-1">
                      <span className="text-xs font-semibold text-slate-700">
                        {isMe ? 'You' : staff?.name}
                      </span>
                      {comment.workflow_status && (
                        <span className="text-[9px] font-medium uppercase tracking-wider text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                          {comment.workflow_status}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {format(new Date(comment.created_at), 'HH:mm')}
                      </span>
                    </div>
                    
                    <div className={`
                      px-4 py-2.5 rounded-2xl text-sm shadow-sm border border-transparent
                      ${isMe 
                        ? 'bg-teal-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-800 rounded-tl-none border-slate-200'}
                    `}>
                      {comment.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
          <Input 
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Type an instruction or update..." 
            className="flex-1 rounded-full pr-12 bg-slate-50 border-slate-200 focus-visible:ring-teal-500 shadow-inner"
            disabled={mutation.isPending}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!newComment.trim() || mutation.isPending}
            className="absolute right-1 h-8 w-8 rounded-full bg-teal-600 hover:bg-teal-700 text-white transition-all disabled:opacity-50 disabled:bg-slate-300"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
