import type { NoteIndexItem } from '@onchain-notes/types';

const STORAGE_KEY = 'note3-index';

export function getLocalIndex(): NoteIndexItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load local index:', error);
    return [];
  }
}

export function addToLocalIndex(item: NoteIndexItem): void {
  if (typeof window === 'undefined') return;
  
  try {
    const index = getLocalIndex();
    const existingIndex = index.findIndex(existing => existing.id === item.id);
    
    if (existingIndex >= 0) {
      // Update existing item
      index[existingIndex] = { ...index[existingIndex], ...item };
    } else {
      // Add new item
      index.push(item);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(index));
  } catch (error) {
    console.error('Failed to save to local index:', error);
  }
}

export function findById(id: string): NoteIndexItem | undefined {
  const index = getLocalIndex();
  return index.find(item => item.id === id);
}

export function removeFromLocalIndex(id: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const index = getLocalIndex();
    const filteredIndex = index.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredIndex));
  } catch (error) {
    console.error('Failed to remove from local index:', error);
  }
}
