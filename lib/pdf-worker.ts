import { GlobalWorkerOptions } from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';

export function setupPDFWorker() {
  if (typeof window === 'undefined') return;
  GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
}