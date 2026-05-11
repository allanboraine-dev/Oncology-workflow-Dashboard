'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDocuments, uploadDocument, getDocumentUrl } from '@/lib/api';
import { StaffProfile, WorkflowDocument } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { FileIcon, Loader2, UploadCloud, DownloadCloud } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function DocumentList({ 
  workflowId,
  currentStaff
}: { 
  workflowId: string;
  currentStaff: StaffProfile;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', workflowId],
    queryFn: () => fetchDocuments(workflowId),
  });

  useEffect(() => {
    const channel = supabase
      .channel(`documents-${workflowId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workflow_documents',
          filter: `workflow_id=eq.${workflowId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['documents', workflowId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workflowId, queryClient]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: add some validation here for size and type
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File too large', { description: 'Please select a file smaller than 10MB.' });
      return;
    }

    setIsUploading(true);
    try {
      await uploadDocument(workflowId, currentStaff.id, file);
      toast.success('File uploaded successfully');
      // Invalidate queries to refresh list
      queryClient.invalidateQueries({ queryKey: ['documents', workflowId] });
    } catch (err: any) {
      toast.error('Upload failed', { description: err.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <ScrollArea className="flex-1 p-6">
        <div className="flex flex-col gap-4 pb-6">
          {(!documents || documents.length === 0) ? (
            <div className="text-center text-sm text-slate-400 mt-10 flex flex-col items-center">
              <FileIcon className="h-12 w-12 text-slate-200 mb-2" />
              <p>No documents uploaded yet.</p>
              <p className="text-xs mt-1">Upload lab results, referral letters, or ID copies.</p>
            </div>
          ) : (
            documents.map((doc: WorkflowDocument) => (
              <a 
                key={doc.id} 
                href={getDocumentUrl(doc.file_path)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-teal-400 hover:shadow-md transition-all group"
              >
                <div className="h-10 w-10 shrink-0 bg-teal-50 text-teal-600 rounded flex items-center justify-center mr-4">
                  <FileIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-slate-800 truncate" title={doc.file_name}>
                    {doc.file_name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatFileSize(doc.file_size)} • Uploaded by {doc.staff_profiles?.name || 'Unknown'}
                  </p>
                </div>
                <div className="flex flex-col items-end shrink-0 ml-4">
                  <span className="text-[10px] text-slate-400 mb-1">
                    {format(new Date(doc.created_at), 'MMM d, HH:mm')}
                  </span>
                  <DownloadCloud className="h-4 w-4 text-slate-300 group-hover:text-teal-600" />
                </div>
              </a>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
        <div className="relative">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden" 
            id="file-upload"
          />
          <Button 
            variant="outline" 
            disabled={isUploading}
            className="w-full h-11 border-dashed border-2 border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-teal-400 hover:text-teal-700 font-medium transition-colors cursor-pointer"
          >
            <label htmlFor="file-upload" className="flex items-center justify-center gap-2 cursor-pointer w-full h-full">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="h-5 w-5" />
                  Select File to Upload
                </>
              )}
            </label>
          </Button>
        </div>
      </div>
    </div>
  );
}
