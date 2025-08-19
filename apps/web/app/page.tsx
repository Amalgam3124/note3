'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import LoadingSpinner from '../src/components/LoadingSpinner';
import { getLocalIndex } from '../src/lib/note';
// Remove static type import to avoid SSR issues
// import type { NoteIndexItem } from '@onchain-notes/types';

// Define type locally to avoid SSR issues
type NoteIndexItem = {
  id: string;
  title: string;
  cid: string;
  createdAt: number;
  updatedAt?: number;
  public?: boolean;
  // Note: author field is not in the actual type, so we don't include it
};

export default function HomePage() {
  const { isConnected } = useAccount();
  const [notes, setNotes] = useState<NoteIndexItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Get notes from local index
    const localNotes = getLocalIndex();
    
    // Also get notes from 0G Storage local cache
    let allNotes = [...localNotes];
    
    if (typeof window !== 'undefined') {
      try {
        // Scan localStorage for 0G Storage notes
        const keys = Object.keys(localStorage);
        const ogNoteKeys = keys.filter(key => key.startsWith('0g-note-'));
        
        ogNoteKeys.forEach(key => {
          try {
            const cid = key.replace('0g-note-', '');
            const noteData = JSON.parse(localStorage.getItem(key) || '{}');
            
            // Create index item for 0G Storage note
            const ogNote: NoteIndexItem = {
              id: noteData.id || `og-${cid}`,
              title: noteData.title || 'Untitled Note',
              cid: cid,
              createdAt: noteData.createdAt || Date.now(),
              public: noteData.public || false
            };
            
            // Check if this note is already in local index
            const existingIndex = allNotes.findIndex(n => n.id === ogNote.id);
            if (existingIndex >= 0) {
              // Update existing note
              allNotes[existingIndex] = { ...allNotes[existingIndex], ...ogNote };
            } else {
              // Add new note
              allNotes.push(ogNote);
            }
          } catch (parseError) {
            console.warn('Failed to parse 0G Storage note:', parseError);
          }
        });
        
        console.log('Found notes:', {
          localIndex: localNotes.length,
          ogStorage: ogNoteKeys.length,
          total: allNotes.length
        });
      } catch (error) {
        console.error('Failed to scan 0G Storage notes:', error);
      }
    }
    
    // Sort notes by creation date (newest first)
    allNotes.sort((a, b) => b.createdAt - a.createdAt);
    
    setNotes(allNotes);
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // Show loading state before client-side rendering
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
        <Link
          href="/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          New Note
        </Link>
      </div>

      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Please connect your wallet to create and manage notes.
          </p>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No notes yet.</p>
          {isConnected && (
            <Link
              href="/new"
              className="inline-block mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create your first note
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {notes.map((note) => (
            <Link
              key={note.id}
              href={`/note/${note.id}`}
              className="block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {note.title}
              </h2>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Created: {formatDate(note.createdAt)}</span>
                <span className="font-mono text-xs">{note.cid.slice(0, 10)}...</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
