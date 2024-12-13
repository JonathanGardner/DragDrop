"use client";

import React, { useEffect, useState } from 'react';
import { templates } from '@/data/templates';
import { useDragDrop } from '@/hooks/useDragDrop';
import TemplateList from './TemplateList';
import { PDFDocumentProxy } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist';
import { setupPDFWorker } from '@/lib/pdf-worker';
import PDFPageCanvas from './PDFPageCanvas';
import DraggableTemplate from './DraggableTemplate';
import { Template } from '@/types';

interface DragDropPDFCanvasProps {
  file: File;
  initialPlacements: { [pageIndex: number]: DroppedTemplateData[] };
  onSave: (pageStatesData: { droppedTemplates: DroppedTemplateData[] }[]) => void;
}

interface DroppedTemplateData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  templateId: string; // Stored ID to find the actual template
}

interface DroppedTemplate {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  template: Template; // Full template restored from templateId
}

interface PageState {
  droppedTemplates: DroppedTemplate[]; // fully constructed templates
  originalCanvasSize: { width: number; height: number };
  actualCanvasSize: { width: number; height: number };
  pageRect: DOMRect | null;
  pageContainerRef: React.RefObject<HTMLDivElement>;
  isPageRendered: boolean;
  imgSrc: string | null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function restoreTemplates(data: DroppedTemplateData[]): DroppedTemplate[] {
  return data.map(d => {
    const foundTemplate = templates.find(t => t.id === d.templateId);
    if (!foundTemplate) {
      // If template not found, create a fallback so no errors occur.
      return {
        ...d,
        template: {
          id: d.templateId,
          icon: () => null,
          width: 50,
          height: 50
        }
      };
    }
    return {
      ...d,
      template: foundTemplate
    };
  });
}

export default function DragDropPDFCanvas({ file, initialPlacements, onSave }: DragDropPDFCanvasProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<number[]>([]);

  const {
    draggedTemplate,
    dragPosition,
    isValidDrop,
    dragOffset,
    handleDragStart,
    handleDragEnd,
    isWithinBounds,
    getAdjustedPosition,
    setDragPosition,
    setIsValidDrop
  } = useDragDrop();

  const [pageStates, setPageStates] = useState<PageState[]>([]);
  const [currentHoverPageIndex, setCurrentHoverPageIndex] = useState<number | null>(null);

  useEffect(() => {
    setupPDFWorker();
  }, []);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        const fileReader = new FileReader();
        fileReader.onload = async function() {
          const typedarray = new Uint8Array(this.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          setPdfDoc(pdf);
          setPages(Array.from({ length: pdf.numPages }, (_, i) => i + 1));

          const initialStates = Array.from({ length: pdf.numPages }, (_, i) => ({
            droppedTemplates: restoreTemplates(initialPlacements[i] || []),
            originalCanvasSize: { width: 850, height: 1100 },
            actualCanvasSize: { width: 850, height: 1100 },
            pageRect: null,
            pageContainerRef: React.createRef<HTMLDivElement>(),
            isPageRendered: false,
            imgSrc: null,
          }));
          setPageStates(initialStates);
        };
        fileReader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('Error loading PDF:', error);
      }
    };

    loadPDF();
  }, [file, initialPlacements]);

  useEffect(() => {
    if (!pdfDoc || pages.length === 0) return;

    let isMounted = true;

    (async function renderAllPages() {
      for (let i = 0; i < pages.length; i++) {
        if (!isMounted) return;
        const pageNumber = pages[i];
        const page = await pdfDoc.getPage(pageNumber);
        const scale = 1.0;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;

        if (!isMounted) return;

        const dataUrl = canvas.toDataURL('image/png');
        setPageStates((prev) => {
          const newStates = [...prev];
          if (!newStates[i]) return prev;
          newStates[i] = {
            ...newStates[i],
            imgSrc: dataUrl,
            originalCanvasSize: { width: viewport.width, height: viewport.height },
            actualCanvasSize: { width: viewport.width, height: viewport.height },
            isPageRendered: true,
          };
          return newStates;
        });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [pdfDoc, pages]);

  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
      setDragPosition({ x: e.clientX, y: e.clientY });

      if (!draggedTemplate) {
        setIsValidDrop(false);
        setCurrentHoverPageIndex(null);
        return;
      }

      const clientX = e.clientX;
      const clientY = e.clientY;

      let foundPageIndex: number | null = null;

      for (let i = 0; i < pageStates.length; i++) {
        const state = pageStates[i];
        const rect = state.pageContainerRef.current?.getBoundingClientRect();
        if (rect &&
          clientX >= rect.left && clientX <= rect.right &&
          clientY >= rect.top && clientY <= rect.bottom) {
          const position = getAdjustedPosition(clientX, clientY, rect);
          const valid = isWithinBounds(position.x, position.y, draggedTemplate, pageStates[i].actualCanvasSize);
          setIsValidDrop(valid);
          foundPageIndex = i;
          break;
        }
      }

      if (foundPageIndex === null) {
        setIsValidDrop(false);
      }

      setCurrentHoverPageIndex(foundPageIndex);
    };

    window.addEventListener('dragover', handleGlobalDragOver);
    return () => window.removeEventListener('dragover', handleGlobalDragOver);
  }, [draggedTemplate, pageStates, getAdjustedPosition, setDragPosition, setIsValidDrop, isWithinBounds]);

  const handleDragOverPage = (e: React.DragEvent, pageIndex: number) => {
    e.preventDefault();
    if (!draggedTemplate) return;
    const container = pageStates[pageIndex].pageContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const position = getAdjustedPosition(e.clientX, e.clientY, rect);
    const valid = isWithinBounds(position.x, position.y, draggedTemplate, pageStates[pageIndex].actualCanvasSize);
    setIsValidDrop(valid);
  };

  const handleDropOnPage = (e: React.DragEvent, pageIndex: number) => {
    e.preventDefault();
    if (!draggedTemplate || !isValidDrop) {
      handleDragEnd();
      return;
    }

    const container = pageStates[pageIndex].pageContainerRef.current;
    if (!container) {
      handleDragEnd();
      return;
    }

    const rect = container.getBoundingClientRect();
    const baseCanvasSize = pageStates[pageIndex].originalCanvasSize;
    const templateWFrac = draggedTemplate.width / baseCanvasSize.width;
    const templateHFrac = draggedTemplate.height / baseCanvasSize.height;
    const templateWidthPx = templateWFrac * pageStates[pageIndex].actualCanvasSize.width;
    const templateHeightPx = templateHFrac * pageStates[pageIndex].actualCanvasSize.height;
    const position = getAdjustedPosition(e.clientX, e.clientY, rect);
    const topLeftX = position.x - dragOffset.xFrac * templateWidthPx;
    const topLeftY = position.y - dragOffset.yFrac * templateHeightPx;
    const relativeX = topLeftX / rect.width;
    const relativeY = topLeftY / rect.height;

    const newItem: DroppedTemplate = {
      id: `${draggedTemplate.id}-${Date.now()}`,
      x: relativeX,
      y: relativeY,
      width: templateWFrac,
      height: templateHFrac,
      template: draggedTemplate
    };

    setPageStates((prev) => {
      const newStates = [...prev];
      newStates[pageIndex] = {
        ...newStates[pageIndex],
        droppedTemplates: [...newStates[pageIndex].droppedTemplates, newItem],
      };
      return newStates;
    });

    handleDragEnd();
    setCurrentHoverPageIndex(null);
  };

  const handleUpdatePosition = (pageIndex: number, id: string, x: number, y: number) => {
    setPageStates((prev) => {
      const newStates = [...prev];
      newStates[pageIndex] = {
        ...newStates[pageIndex],
        droppedTemplates: newStates[pageIndex].droppedTemplates.map((item) =>
          item.id === id ? { ...item, x, y } : item
        ),
      };
      return newStates;
    });
  };

  const handleUpdateSize = (pageIndex: number, id: string, w: number, h: number) => {
    setPageStates((prev) => {
      const newStates = [...prev];
      newStates[pageIndex] = {
        ...newStates[pageIndex],
        droppedTemplates: newStates[pageIndex].droppedTemplates.map((item) =>
          item.id === id ? { ...item, width: w, height: h } : item
        ),
      };
      return newStates;
    });
  };

  const handleDuplicate = (pageIndex: number, id: string) => {
    setPageStates((prev) => {
      const newStates = [...prev];
      const item = newStates[pageIndex].droppedTemplates.find((t) => t.id === id);
      if (!item) return prev;

      const maxX = 1 - item.width;
      const maxY = 1 - item.height;
      const newX = clamp(item.x + 0.02, 0, maxX);
      const newY = clamp(item.y + 0.02, 0, maxY);

      const newItem = {
        ...item,
        id: `${item.template.id}-${Date.now()}`,
        x: newX,
        y: newY,
      };
      newStates[pageIndex] = {
        ...newStates[pageIndex],
        droppedTemplates: [...newStates[pageIndex].droppedTemplates, newItem],
      };
      return newStates;
    });
  };

  const handleDelete = (pageIndex: number, id: string) => {
    setPageStates((prev) => {
      const newStates = [...prev];
      newStates[pageIndex] = {
        ...newStates[pageIndex],
        droppedTemplates: newStates[pageIndex].droppedTemplates.filter((t) => t.id !== id),
      };
      return newStates;
    });
  };

  useEffect(() => {
    const updateRects = () => {
      setPageStates((prev) => {
        let updated = false;
        const newStates = prev.map((state) => {
          if (!state.isPageRendered || !state.pageContainerRef.current) return state;
          const rect = state.pageContainerRef.current.getBoundingClientRect();
          if (!rect) return state;

          const newActual = { width: rect.width, height: rect.height };
          const sizeChanged =
            newActual.width !== state.actualCanvasSize.width ||
            newActual.height !== state.actualCanvasSize.height;

          if (sizeChanged || (state.pageRect?.width !== rect.width || state.pageRect?.height !== rect.height)) {
            updated = true;
            return {
              ...state,
              pageRect: rect,
              actualCanvasSize: newActual,
            };
          }
          return state;
        });

        return updated ? newStates : prev;
      });
    };

    const observer = new ResizeObserver(updateRects);
    pageStates.forEach((ps) => {
      if (ps.pageContainerRef.current) {
        observer.observe(ps.pageContainerRef.current);
      }
    });

    updateRects();

    window.addEventListener('resize', updateRects);

    return () => {
      window.removeEventListener('resize', updateRects);
      observer.disconnect();
    };
  }, [pdfDoc, pageStates]);

  let previewActual = { width: 850, height: 1100 };
  if (currentHoverPageIndex !== null && pageStates[currentHoverPageIndex]) {
    previewActual = pageStates[currentHoverPageIndex].actualCanvasSize;
  } else if (pageStates[0]) {
    previewActual = pageStates[0].actualCanvasSize;
  }

  const handleSave = () => {
    // Transform DroppedTemplate back to DroppedTemplateData for saving
    const output = pageStates.map(ps => ({
      droppedTemplates: ps.droppedTemplates.map(dt => ({
        id: dt.id,
        x: dt.x,
        y: dt.y,
        width: dt.width,
        height: dt.height,
        templateId: dt.template.id
      }))
    }));
    onSave(output);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {draggedTemplate && (
        <div
          style={{
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: 9999,
            ...(() => {
              const baseCanvasSize = pageStates[0]?.originalCanvasSize || { width: 850, height: 1100 };
              const templateWFrac = draggedTemplate.width / baseCanvasSize.width;
              const templateHFrac = draggedTemplate.height / baseCanvasSize.height;
              const previewW = templateWFrac * previewActual.width;
              const previewH = templateHFrac * previewActual.height;
              const left = dragPosition.x - dragOffset.xFrac * previewW;
              const top = dragPosition.y - dragOffset.yFrac * previewH;
              return { left: `${left}px`, top: `${top}px` };
            })()
          }}
        >
          <DraggableTemplate
            template={draggedTemplate}
            position={{ x: 0, y: 0 }}
            width={draggedTemplate ? draggedTemplate.width / (pageStates[0]?.originalCanvasSize.width || 850) : 0}
            height={draggedTemplate ? draggedTemplate.height / (pageStates[0]?.originalCanvasSize.height || 1100) : 0}
            isDragging={true}
            isValidDrop={isValidDrop}
            baseCanvasSize={pageStates[0]?.originalCanvasSize || { width: 850, height: 1100 }}
            actualCanvasSize={previewActual}
            canvasOffset={{ left: 0, top: 0 }}
            isPreview={true}
          />
        </div>
      )}

      <div className="flex-1 space-y-12 overflow-auto pb-2 border rounded-lg bg-gray-50 p-2">
        {pages.map((pageNumber, i) => {
          const ps = pageStates[i];
          return (
            <div key={pageNumber}>
              <div
                ref={ps?.pageContainerRef}
                className="relative"
                style={{ position: 'relative' }}
              >
                {ps?.imgSrc ? (
                  <img
                    src={ps.imgSrc}
                    alt={`Page ${pageNumber}`}
                    style={{ pointerEvents: 'none', display: 'block', width: '100%', height: 'auto' }}
                  />
                ) : (
                  <div style={{ width: '850px', height: '1100px', background: '#fff' }}>Loading page...</div>
                )}

                {ps && ps.isPageRendered && ps.pageRect && (
                  <PDFPageCanvas
                    pageRef={ps.pageContainerRef}
                    droppedTemplates={ps.droppedTemplates}
                    draggedTemplate={null}
                    dragPosition={{ x:0, y:0 }}
                    isValidDrop={false}
                    actualCanvasSize={ps.actualCanvasSize}
                    pageRect={ps.pageRect}
                    onDrop={(e) => handleDropOnPage(e, i)}
                    onDragOver={(e) => handleDragOverPage(e, i)}
                    onUpdatePosition={(id, x, y) => handleUpdatePosition(i, id, x, y)}
                    onUpdateSize={(id, w, h) => handleUpdateSize(i, id, w, h)}
                    onDuplicate={(id) => handleDuplicate(i, id)}
                    onDelete={(id) => handleDelete(i, id)}
                  />
                )}
              </div>
              <p className="text-center text-xs text-gray-500">
                Page {pageNumber} of {pdfDoc?.numPages}
              </p>
            </div>
          );
        })}
      </div>

      <div className="h-min w-full md:w-64 flex-shrink-0 border bg-gray-50 p-4 rounded-lg overflow-y-auto sticky top-5 self-start">
        <TemplateList
          templates={templates}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          actualCanvasSize={pageStates[0]?.actualCanvasSize || { width: 850, height: 1100 }}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}
