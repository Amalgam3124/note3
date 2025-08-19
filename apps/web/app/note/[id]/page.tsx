'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { useAccount } from 'wagmi';
import LoadingSpinner from '../../../src/components/LoadingSpinner';
import PageLoadingSpinner from '../../../src/components/PageLoadingSpinner';
import { findById } from '../../../src/lib/note';
import { getNote } from '../../../src/lib/0g-storage';
// Remove static type imports to avoid SSR issues
// import type { Note, NoteIndexItem } from '@onchain-notes/types';

// Define types locally to avoid SSR issues
type Note = {
  id: string;
  title: string;
  markdown: string;
  images: string[];
  public: boolean;
  createdAt: number;
  author: string;
};

type NoteIndexItem = {
  id: string;
  title: string;
  cid: string;
  createdAt: number;
  updatedAt?: number;
  public?: boolean;
  // Note: author field is not in the actual type, so we don't include it
};

interface NotePageProps {
  params: {
    id: string;
  };
}

export default function NotePage({ params }: NotePageProps) {
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [indexItem, setIndexItem] = useState<NoteIndexItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadNoteData = async () => {
      try {
        setIsLoading(true);
        setError('');

        // First try to find note in local index
        let foundIndex = findById(params.id);
        
        if (!foundIndex) {
          // If not found in local index, try to load directly from 0G Storage
          // This happens when a note was just uploaded and hasn't been indexed yet
          console.log('Note not found in local index, attempting to load from 0G Storage...');
          
          try {
            // For newly uploaded notes, the ID might be the transaction hash
            // Try to load the note directly using the ID as CID
            const noteData = await getNote(params.id);
            
            // If successful, create a local index item
            const newIndexItem: NoteIndexItem = {
              id: noteData.id,
              title: noteData.title,
              cid: params.id, // Use the ID as CID (transaction hash)
              createdAt: noteData.createdAt,
              public: noteData.public
            };
            
            // TODO: Add to local index for future access
            // For now, we'll just use it in memory
            console.log('Created local index item:', newIndexItem);
            
            setIndexItem(newIndexItem);
            setNote(noteData);
            console.log('Note loaded directly from 0G Storage');
            return;
          } catch (storageError) {
            console.log('Failed to load from 0G Storage:', storageError);
            
            // If the ID is not a valid CID, try to find by note ID in the format "walletAddress-timestamp"
            if (params.id.includes('-')) {
              try {
                // Try to find notes with similar ID pattern in local storage
                const allNotes = JSON.parse(localStorage.getItem('notes') || '[]');
                const matchingNote = allNotes.find((n: any) => n.id === params.id);
                
                if (matchingNote) {
                  console.log('Found note in local storage:', matchingNote);
                  setIndexItem(matchingNote);
                  setNote(matchingNote);
                  return;
                }
              } catch (localError) {
                console.log('Failed to check local storage:', localError);
              }
            }
            
            setError('Note not found in local index or 0G Storage. The note may not exist or the ID is invalid.');
            return;
          }
        }
        
        // If found in local index, load from 0G Storage using the CID
        setIndexItem(foundIndex);
        const noteData = await getNote(foundIndex.cid);
        setNote(noteData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load note');
      } finally {
        setIsLoading(false);
      }
    };

    loadNoteData();
  }, [params.id]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading note...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Error</h1>
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!note || !indexItem) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Note not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{note.title}</h1>
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="prose max-w-none">
          <ReactMarkdown>{note.markdown}</ReactMarkdown>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Author:</span>
            <span className="ml-2 font-mono">{note.author}</span>
          </div>
          <div>
            <span className="font-medium">Created:</span>
            <span className="ml-2">{formatDate(note.createdAt)}</span>
          </div>
          <div>
            <span className="font-medium">CID:</span>
            <span className="ml-2 font-mono text-xs">{indexItem.cid}</span>
          </div>
          <div>
            <span className="font-medium">Note ID:</span>
            <span className="ml-2 font-mono text-xs">{note.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
