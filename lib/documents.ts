interface Document {
  id: string;
  name: string;
  content: string;    // For text documents
  base64?: string;    // For pdf documents
  type: 'pdf' | 'text';
  draft: boolean;
}


export function getDocuments(): Document[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem("documents");
  return stored ? JSON.parse(stored) : [];
}

export function getDocumentById(id: string): Document | null {
  const docs = getDocuments();
  return docs.find(doc => doc.id === id) || null;
}

export function updateDocument(updatedDoc: Document): void {
  const docs = getDocuments();
  const index = docs.findIndex(doc => doc.id === updatedDoc.id);
  if (index !== -1) {
    docs[index] = updatedDoc;
    localStorage.setItem("documents", JSON.stringify(docs));
  }
}
