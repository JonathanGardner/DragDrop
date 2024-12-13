"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PDFPageWithCanvas from '@/components/DropDropPDFCanvas';

// Import the Breadcrumb components
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Document {
  id: string;
  name: string;
  content: string;
  pdfData?: number[];
  type: 'pdf' | 'text';
  draft: boolean;
  createdAt?: string;
  recipient?: string;
  placements?: { [pageIndex: number]: DroppedTemplateData[] };
}

// This is what we store in localStorage:
interface DroppedTemplateData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  templateId: string; // Stored template reference
}

export default function DocumentPage({ params }: { params: { id: string } }) {
  const [doc, setDoc] = useState<Document | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("documents");
    if (stored) {
      const documents: Document[] = JSON.parse(stored);
      const found = documents.find(d => d.id === params.id);
      setDoc(found || null);
    }
  }, [params.id]);

  const handleSaveTemplates = (pageStatesData: { droppedTemplates: DroppedTemplateData[] }[]) => {
    if (!doc) return;

    const placements: { [pageIndex: number]: DroppedTemplateData[] } = {};
    pageStatesData.forEach((ps, i) => {
      placements[i] = ps.droppedTemplates;
    });

    const stored = localStorage.getItem("documents");
    if (!stored) return;
    const documents: Document[] = JSON.parse(stored);

    const updatedDocs = documents.map(d => {
      if (d.id === doc.id) {
        return { ...d, placements };
      }
      return d;
    });

    localStorage.setItem("documents", JSON.stringify(updatedDocs));

    setDoc((prev) => prev ? { ...prev, placements } : prev);
  };

  if (!doc) {
    return (
      <main className="min-h-screen bg-white text-black p-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-gray-500">Document not found.</p>
          <Link href="/documents" className="text-sm underline hover:no-underline mt-4 inline-block">
            Back to Documents
          </Link>
        </div>
      </main>
    );
  }

  let fileForPDF: File | null = null;
  if (doc.type === 'pdf' && doc.pdfData) {
    const uint8Array = new Uint8Array(doc.pdfData);
    fileForPDF = new File([uint8Array], doc.name, { type: 'application/pdf' });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white text-black p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/documents">Documents</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage aria-current="page">{doc.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* End of Breadcrumb */}

        <header className="mt-4 mb-4">
          <h1 className="text-xl font-medium truncate">{doc.name}</h1>
        </header>

        <div className="border-t border-gray-200 mt-6 pt-6">
          {doc.type === 'pdf' && fileForPDF ? (
            <PDFPageWithCanvas
              file={fileForPDF}
              initialPlacements={doc.placements || {}}
              onSave={handleSaveTemplates}
            />
          ) : doc.type === 'text' ? (
            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-6">
              {doc.content}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Unsupported document type.</p>
          )}
        </div>
      </div>
    </main>
  );
}
