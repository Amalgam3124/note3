'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWalletClient } from 'wagmi';
import ReactMarkdown from 'react-markdown';
import LoadingSpinner from '../../src/components/LoadingSpinner';
import PageLoadingSpinner from '../../src/components/PageLoadingSpinner';
// Remove static type import to avoid SSR issues
// import type { Note } from '@onchain-notes/types';

// Extended Note type with CID - Define locally to avoid SSR issues
type Note = {
  id: string;
  title: string;
  markdown: string;
  images: string[];
  public: boolean;
  createdAt: number;
  author: string;
};

type NoteWithCID = Note & { cid?: string };

export default function NewNotePage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Page loading state
  useEffect(() => {
    // Simulate page loading process
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 2000); // Hide loading state after 2 seconds

    return () => clearTimeout(timer);
  }, []);

  // Use useCallback to optimize functions
  const handleSave = useCallback(async () => {
    if (!title.trim() || !content.trim()) {
      setError('Please fill in both title and content');
      return;
    }

    if (!isConnected || !walletClient) {
      setError('Please connect your wallet first');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Dynamically import the saveNote function to avoid SSR issues
      const { saveNote } = await import('../../src/lib/0g-storage');
      
      const { note } = await saveNote(
        title.trim(), 
        content.trim(), 
        walletClient
      );
      router.push(`/note/${note.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save note';
      
      // Check if it's insufficient balance error
      if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient balance')) {
        setError(`Insufficient balance! Please get testnet 0G tokens from https://faucet.0g.ai/. Error details: ${errorMessage}`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  }, [title, content, isConnected, walletClient, router]);

  // Use useCallback to optimize input handling
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Handle tab key input
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      
      // Insert tab character at cursor position
      const newContent = content.substring(0, start) + '\t' + content.substring(end);
      setContent(newContent);
      
      // Set cursor position to after the tab
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 1;
        target.focus();
      }, 0);
    }
  }, [content]);

  // Real-time editing content
  const renderContent = useMemo(() => {
    if (!content.trim()) {
      return (
        <div className="text-gray-400 text-center py-8">
          <p>Start typing to see your content rendered in real-time</p>
          <p className="text-sm mt-2">Supports Markdown syntax</p>
        </div>
      );
    }

    return (
      <div className="prose max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }, [content]);

  // If page is still loading, show loading state
  if (isPageLoading) {
    return (
      <PageLoadingSpinner 
        message="Preparing Markdown Editor" 
        isCompiling={true}
      />
    );
  }

  return (
    <>
      {/* Loading state during saving */}
      {isSaving && (
        <LoadingSpinner 
          message="Saving to 0G Storage" 
          showProgress={true}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">New Note</h1>
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back
          </button>
        </div>

        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Please connect your wallet to create notes.
            </p>
          </div>
        )}

        {/* Title input */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={handleTitleChange}
            placeholder="Enter note title..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={!isConnected}
          />
        </div>

        {/* Real-time Markdown editor */}
        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Content (Markdown) - Real-time Preview
          </label>
          
          {/* Split editor: left input, right preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Markdown input */}
            <div className="space-y-2">
              <div className="text-sm text-gray-600 mb-2">📝 Input (Markdown)</div>
              <textarea
                id="content"
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                placeholder="Start typing your Markdown content here..."
                className="w-full min-h-[500px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white resize-none font-mono text-sm"
                style={{
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}
              />
              
              {/* Edit hint */}
              <div className="text-xs text-gray-500">
                <p>💡 <strong>Markdown Syntax Support:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><code className="bg-gray-100 px-1 rounded">#</code> Headings</li>
                  <li><code className="bg-gray-100 px-1 rounded">**Bold**</code> and <code className="bg-gray-100 px-1 rounded">*Italic*</code></li>
                  <li><code className="bg-gray-100 px-1 rounded">[Link](URL)</code> and <code className="bg-gray-100 px-1 rounded">![Image](URL)</code></li>
                  <li><code className="bg-gray-100 px-1 rounded">- List item</code> and <code className="bg-gray-100 px-1 rounded">1. Ordered list</code></li>
                  <li><code className="bg-gray-100 px-1 rounded">`Code`</code> and <code className="bg-gray-100 px-1 rounded">```Code block```</code></li>
                  <li><code className="bg-gray-100 px-1 rounded">Tab</code> key support</li>
                </ul>
              </div>
            </div>
            
            {/* Right: Real-time preview */}
            <div className="space-y-2">
              <div className="text-sm text-gray-600 mb-2">👁️ Live Preview</div>
              <div className="w-full min-h-[500px] px-3 py-2 border border-gray-300 rounded-lg bg-white overflow-y-auto">
                {content.trim() ? (
                  <div className="prose max-w-none">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-8">
                    <p>Start typing in the left panel to see live preview here</p>
                    <p className="text-sm mt-2">Supports Markdown syntax</p>
                  </div>
                )}
              </div>
              
              {/* Preview hint */}
              <div className="text-xs text-gray-500">
                <p>✨ <strong>Real-time Preview Features:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Left panel input, right panel live rendering</li>
                  <li>Supports all standard Markdown syntax</li>
                  <li>What You See Is What You Get editing experience</li>
                  <li>Tab key input support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Fee information */}
        {/* Removed estimated fee display */}

        {/* Action buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleBack}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isConnected || isSaving}
            className={`px-6 py-2 rounded-lg transition-colors ${
              !isConnected
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isSaving
                ? 'bg-blue-400 text-white cursor-wait'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            title={
              !isConnected
                ? 'Please connect your wallet first'
                : ''
            }
          >
            {isSaving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>
    </>
  );
}
