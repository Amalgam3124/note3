export type Note = {
  id: string;                 // `${address}-${Date.now()}`
  title: string;
  markdown: string;
  images: string[];           // Reserved for Wave2
  public: boolean;            // Reserved for Wave3
  createdAt: number;
  author: `0x${string}`;      // Wallet address
};

export type NoteIndexItem = {
  id: string;
  cid: string;
  title: string;
  createdAt: number;
  updatedAt?: number;
  public?: boolean;
};

export type NoteSnapshot = {
  title: string;
  markdown: string;
  images: string[];
  sourceCID: string;
  sha256: `0x${string}`;
  publishedAt: number;
  author: `0x${string}`;
};
