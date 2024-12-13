import React, { useEffect, useRef, useState } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';

interface PDFPageRendererProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  onPageRendered: (width: number, height: number) => void;
}

/**
 * Renders a PDF page once and converts it to an image. 
 * The page never re-renders again, preventing multiple render calls on the same canvas.
 */
function PDFPageRenderer({ pdfDoc, pageNumber, onPageRendered }: PDFPageRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const scale = 1.0;

  useEffect(() => {
    let isMounted = true;
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d')!;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        if (isMounted) {
          onPageRendered(canvas.width, canvas.height);

          // Convert canvas to data URL and store in state
          const dataUrl = canvas.toDataURL('image/png');
          setImgSrc(dataUrl);
        }
      } catch (error) {
        console.error(`Error rendering PDF page ${pageNumber}:`, error);
      }
    };
    renderPage();

    return () => {
      isMounted = false;
    };
  }, [pdfDoc, pageNumber, scale, onPageRendered]);

  return (
    <div
      className="react-pdf__Page"
      data-page-number={pageNumber}
      style={{
        backgroundColor: 'white',
        position: 'relative',
        display: 'inline-block',
      }}
    >
      {/* The canvas is used only once for initial rendering */}
      <canvas
        ref={canvasRef}
        className="react-pdf__Page__canvas block select-none w-auto h-auto"
        style={{ pointerEvents: 'none', display: imgSrc ? 'none' : 'block' }}
      />
      {imgSrc && <img src={imgSrc} alt={`Page ${pageNumber}`} style={{ pointerEvents: 'none', display: 'block' }} />}
    </div>
  );
}

export default React.memo(PDFPageRenderer);
