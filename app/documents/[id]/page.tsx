// app/documents/[id]/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PDFViewer from '@/components/PDFViewer';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { templates } from '@/data/templates';
import { Template } from '@/types';

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface DroppedTemplateData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  templateId: string; // Stored ID to find the actual template
}

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

// Convert DroppedTemplateData[] into a display-ready form with the template object
function restoreTemplates(data: DroppedTemplateData[]): {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  template: Template;
}[] {
  return data.map(d => {
    const foundTemplate = templates.find(t => t.id === d.templateId);
    return {
      ...d,
      template: foundTemplate || {
        id: d.templateId,
        icon: () => null,
        width: 50,
        height: 50,
      },
    };
  });
}

export default function DocumentPage({ params }: { params: { id: string } }) {
  const [doc, setDoc] = useState<Document | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("documents");
    if (stored) {
      const documents: Document[] = JSON.parse(stored);
      const found = documents.find(d => d.id === params.id);
      setDoc(found || null);
    }
  }, [params.id]);

  if (!doc) {
    return (
      <main className="min-h-screen bg-white text-black p-6">
        <div className="max-w-2xl mx-auto">
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

  const createdDate = doc.createdAt ? format(new Date(doc.createdAt), "MM/dd/yyyy") : "N/A";

  // Restore placements from doc.placements
  // placements is an object with keys as pageIndex: DroppedTemplateData[]
  // We'll transform it into a structure we can pass to PDFViewer
  const pageItems = doc.placements
    ? Object.keys(doc.placements).map((pageIndex) => {
        const idx = parseInt(pageIndex, 10);
        return { pageIndex: idx, items: restoreTemplates(doc.placements![idx]) };
      })
    : [];

  return (
    <main className="min-h-screen bg-white text-black p-6">
      <div className="max-w-4xl mx-auto">
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

        <div className="border-t border-gray-200 flex flex-col md:flex-row gap-8 justify-center items-start mt-6 pt-6">
          {/* Left Side: PDF with placed items overlay (view-only) */}
          <div className="flex-1 space-y-12 overflow-auto pb-2 border rounded-lg bg-gray-50 p-2">
            {doc.type === 'pdf' && fileForPDF ? (
              <PDFViewer
                file={fileForPDF}
                scale={1.0}
                placements={pageItems}
                viewOnly={true}
              />
            ) : doc.type === 'text' ? (
              <div className="text-sm text-gray-800 whitespace-pre-wrap leading-6">
                {doc.content}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Unsupported document type.</p>
            )}
          </div>

          {/* Right Side: Menus (Static info) */}
          <div className="flex flex-col space-y-4 w-full md:w-64 flex-shrink-0 sticky top-0 self-start">
            {/* Document Info */}
            <div className="border bg-gray-50 p-4 rounded-lg overflow-y-auto divide-y">
              <div className='mb-4'>
                <h2 className="text-sm font-medium text-gray-700">
                  {doc.draft ? "Document Draft" : "Document Finalized"}
                </h2>
                <h1 className="text-[.6rem] font-sm text-gray-700">
                  {doc.draft ? "This document has not been finalized" : "This document is finalized and cannot be edited"}
                </h1>
              </div>
              <div>
                <Button variant={"outline"} asChild>
                  <Link
                    href={`/documents/${doc.id}/edit`}
                    className="block font-semibold py-2 px-4 rounded text-center w-full mt-4"
                  >
                    {doc.draft ? "Edit Draft" : "View/Edit"}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="border bg-gray-50 p-4 rounded-lg overflow-y-auto divide-y">
              <div className="mb-4">
                <h2 className="text-sm font-medium text-gray-700">Information</h2>
              </div>
              <div className="text-sm text-gray-700 pt-2 space-y-2">
                <div className="flex justify-between">
                  <span>Uploaded by:</span>
                  <span className="text-right">You</span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="text-right">{createdDate}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
