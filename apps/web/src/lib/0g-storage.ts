// Complete 0G Storage implementation
// Access 0G Storage functionality through SDK package

import { Note } from '@onchain-notes/types';

// Extended Note type with CID
type NoteWithCID = Note & { cid?: string };

// Save note to 0G Storage
export async function saveNote(
  title: string,
  content: string,
  signer: any
): Promise<{ note: NoteWithCID; estimatedFee: bigint }> {
  try {
    console.log('0G Storage: Starting note upload...');
    
    // Validate signer
    if (!signer) {
      throw new Error('Wallet not connected');
    }
    
    // Log signer details for debugging
    console.log('0G Storage: Signer type:', typeof signer);
    console.log('0G Storage: Signer properties:', Object.getOwnPropertyNames(signer));
    
    // Get wallet address
    let walletAddress: `0x${string}`;
    try {
      if (typeof signer.getAddress === 'function') {
        walletAddress = await signer.getAddress();
      } else if (typeof signer.account === 'object' && signer.account?.address) {
        walletAddress = signer.account.address;
      } else {
        throw new Error('Unable to get wallet address from signer');
      }
    } catch (error) {
      console.error('0G Storage: Failed to get wallet address:', error);
      throw new Error('Failed to get wallet address from signer');
    }
    
    console.log('0G Storage: Wallet address:', walletAddress);
    
    // Create note object
    const note: Note = {
      id: `${walletAddress}-${Date.now()}`,
      title,
      markdown: content, // Use markdown field as per type definition
      images: [],
      public: false,
      createdAt: Date.now(),
      author: walletAddress,
    };
    
    console.log('0G Storage: Note object created:', note);
    
    // Calculate estimated fee based on data size
    const jsonString = JSON.stringify(note);
    const dataSize = jsonString.length;
    const estimatedFee = BigInt(Math.ceil(dataSize * 0.000001 * 1e18)); // Rough estimate: 0.000001 0G per byte
    
    console.log('0G Storage: Estimated storage fee:', {
      dataSize,
      estimatedFee: estimatedFee.toString(),
      estimatedFeeOG: parseFloat((Number(estimatedFee) / 1e18).toFixed(6))
    });
    
    // Dynamically import SDK to avoid SSR issues
    const { putJSON } = await import('@onchain-notes/sdk');
    
    // Upload to 0G Storage
    const { cid } = await putJSON(note, signer);
    
    // Create note with CID
    const noteWithCID: NoteWithCID = {
      ...note,
      cid
    };
    
    console.log('0G Storage: Note uploaded successfully with CID:', cid);
    
    // IMPORTANT: Add the note to local index so it appears on the home page
    // Import the addToLocalIndex function dynamically to avoid SSR issues
    const { addToLocalIndex } = await import('./note');
    
    // Create index item for local storage
    const indexItem = {
      id: note.id,
      title: note.title,
      cid: cid, // Use the actual transaction hash as CID
      createdAt: note.createdAt,
      public: note.public
    };
    
    // Add to local index
    addToLocalIndex(indexItem);
    console.log('0G Storage: Note added to local index:', indexItem);
    
    return { note: noteWithCID, estimatedFee };
  } catch (error) {
    console.error('0G Storage: saveNote failed:', error);
    throw error;
  }
}

// Get note from 0G Storage
export async function getNote(cid: string): Promise<Note> {
  try {
    console.log('0G Storage: Fetching note with CID:', cid);
    
    // Dynamically import SDK to avoid SSR issues
    const { getJSON } = await import('@onchain-notes/sdk');
    
    const note = await getJSON<Note>(cid);
    
    console.log('0G Storage: Note fetched successfully:', note);
    
    return note;
  } catch (error) {
    console.error('0G Storage: getNote failed:', error);
    throw error;
  }
}
