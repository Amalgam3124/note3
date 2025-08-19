export type Note = {
    id: string;
    title: string;
    markdown: string;
    images: string[];
    public: boolean;
    createdAt: number;
    author: `0x${string}`;
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
//# sourceMappingURL=note.d.ts.map