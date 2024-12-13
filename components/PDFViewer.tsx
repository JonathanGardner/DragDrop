// components/PDFViewer.tsx
"use client";

import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { setupPDFWorker } from '@/lib/pdf-worker';
import DraggableTemplate from './DraggableTemplate';

interface DroppedTemplate {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  template: {
    id: string;
    icon: React.FC<{ iconSize?: number; label?: string }>;
    width: number;
    height: number;
  }
}

interface PageItems {
  pageIndex: number;
  items: DroppedTemplate[];
}

interface PDFViewerProps {
  file: File | null;
  scale?: number;
  onDrop?: (e: React.DragEvent, containerRect: DOMRect) => void;
  placements?: PageItems[];  // Added placements for view mode
  viewOnly?: boolean;        // If true, no interaction with placed items
}

export default function PDFViewer({
  file,
  scale = 1.0,
  onDrop,
  placements = [],
  viewOnly = false,
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<number[]>([]);
  const [pageDimensions, setPageDimensions] = useState<{ [pageNum: number]: { width: number; height: number; ref: HTMLDivElement | null } }>({});

  useEffect(() => {
    setupPDFWorker();
  }, []);

  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {
      try {
        const fileReader = new FileReader();
        fileReader.onload = async function() {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          setPdfDoc(pdf);
          setPages(Array.from({ length: pdf.numPages }, (_, i) => i + 1));
        };
        fileReader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    loadPDF();
  }, [file]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!onDrop || !containerRef.current) return;
    onDrop(e, containerRef.current.getBoundingClientRect());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Callback after page is rendered
  const onPageRenderComplete = (pageNumber: number, width: number, height: number, ref: HTMLDivElement | null) => {
    setPageDimensions(prev => ({
      ...prev,
      [pageNumber]: { width, height, ref }
    }));
  };

  // Find placements for each page
  const getPagePlacements = (pageNumber: number): DroppedTemplate[] => {
    const pageIndex = pageNumber - 1; // zero-based
    const found = placements.find(p => p.pageIndex === pageIndex);
    return found ? found.items : [];
  };

  return (
    <div
      className="flex flex-col md:flex-row gap-8"
      ref={containerRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="flex-1 space-y-12 overflow-auto pb-2 border rounded-lg bg-gray-50 p-2 relative">
        {pdfDoc && pages.map((pageNumber) => (
          <div key={pageNumber} style={{ position: 'relative' }}>
            <PageCanvas
              pdfDoc={pdfDoc}
              pageNumber={pageNumber}
              scale={scale}
              onRenderComplete={onPageRenderComplete}
            />
            <p className="text-center text-xs text-gray-500">
              Page {pageNumber} of {pdfDoc.numPages}
            </p>

            {/* Overlay placed items if any */}
            {pageDimensions[pageNumber] && getPagePlacements(pageNumber).length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: `${pageDimensions[pageNumber].width}px`,
                  height: `${pageDimensions[pageNumber].height}px`,
                  pointerEvents: 'none', // no interaction
                }}
              >
                {getPagePlacements(pageNumber).map(item => {
                  const absX = item.x * pageDimensions[pageNumber].width;
                  const absY = item.y * pageDimensions[pageNumber].height;
                  const absW = item.width * pageDimensions[pageNumber].width;
                  const absH = item.height * pageDimensions[pageNumber].height;

                  return (
                    <div
                      key={item.id}
                      style={{
                        position: 'absolute',
                        left: absX,
                        top: absY,
                        width: absW,
                        height: absH,
                      }}
                    >
                      <DraggableTemplate
                        template={item.template}
                        position={{ x: 0, y: 0 }}
                        width={1} // since we're passing final absolute sizes
                        height={1}
                        isDragging={false}
                        isValidDrop={true}
                        baseCanvasSize={{ width: absW, height: absH }}
                        actualCanvasSize={{ width: absW, height: absH }}
                        canvasOffset={{ left: 0, top: 0 }}
                        isPreview={true} // ensures no interaction
                      />
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}


interface PageCanvasProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  onRenderComplete: (pageNumber: number, width: number, height: number, ref: HTMLDivElement | null) => void;
}

function PageCanvas({ pdfDoc, pageNumber, scale, onRenderComplete }: PageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport,
        }).promise;

        // Once rendered, inform parent
        onRenderComplete(pageNumber, viewport.width, viewport.height, containerRef.current);
      } catch (error) {
        console.error(`Error rendering PDF page ${pageNumber}:`, error);
      }
    };
    renderPage();
  }, [pdfDoc, pageNumber, scale, onRenderComplete]);

  return (
    <div
      ref={containerRef}
      className="react-pdf__Page"
      data-page-number={pageNumber}
      style={{
        backgroundColor: 'white',
        position: 'relative',
        display: 'inline-block',
      }}
    >
      <canvas
        ref={canvasRef}
        className="react-pdf__Page__canvas block select-none w-auto h-auto"
        style={{ pointerEvents: 'none', display: 'block' }}
      />
    </div>
  );
}
