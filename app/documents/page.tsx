"use client";

import { useState, useEffect, DragEvent, useRef } from "react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import {
  Search,
  MoreHorizontal,
  Download as DownloadIcon,
  FileText,
  CheckCircle2,
  Inbox,
  Clock,
  Upload,
  Edit,
  Copy,
  Trash2,
  Pencil,
  Eye,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
} from '@/components/ui/dialog';

interface Document {
  id: string;
  name: string;
  content: string;           // For text files
  pdfData?: number[];        // For pdf files
  type: 'pdf' | 'text';
  draft: boolean;
  createdAt: string;
  recipient?: string;        // Just a placeholder for UI
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // State for renaming
  const [renameDoc, setRenameDoc] = useState<Document | null>(null);
  const [newName, setNewName] = useState('');

  // State for delete confirmation
  const [deleteDoc, setDeleteDoc] = useState<Document | null>(null);
  const [confirmationText, setConfirmationText] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("documents");
    if (stored) {
      const parsed: Document[] = JSON.parse(stored);
      setDocuments(parsed);
    }
  }, []);

  const handleFileSelection = async (selectedFile: File | null) => {
    if (!selectedFile) return;
    if (!(selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('text/'))) {
      toast({
        title: "Error",
        description: "Please select a valid PDF or text file",
        variant: "destructive"
      });
      return;
    }

    const newId = await readAndAddDocument(selectedFile);
    if (newId) {
      router.push(`/documents/${newId}`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    e.target.value = ''; // Clear the file input for future selections.
    await handleFileSelection(selectedFile);
  };

  const readAndAddDocument = (fileToRead: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async function(e) {
        const result = e.target?.result;
        if (!result) {
          resolve(null);
          return;
        }

        const recipientNames = ["Sam Green", "John Gray", "Alice Blue", "Jane Gold"];
        const randomRecipient = recipientNames[Math.floor(Math.random()*recipientNames.length)];

        let newDoc: Document;
        if (fileToRead.type === 'application/pdf') {
          const uint8Array = new Uint8Array(result as ArrayBuffer);
          const dataArray = Array.from(uint8Array);
          newDoc = {
            id: uuidv4(),
            name: fileToRead.name,
            content: "",
            pdfData: dataArray,
            type: 'pdf',
            draft: true,
            createdAt: new Date().toISOString(),
            recipient: randomRecipient
          };
        } else {
          const textContent = new TextDecoder().decode(result as ArrayBuffer);
          newDoc = {
            id: uuidv4(),
            name: fileToRead.name,
            content: textContent,
            type: 'text',
            draft: true,
            createdAt: new Date().toISOString(),
            recipient: randomRecipient
          };
        }

        const updatedDocs = [...documents, newDoc];
        setDocuments(updatedDocs);
        localStorage.setItem("documents", JSON.stringify(updatedDocs));

        toast({
          title: "Success",
          description: "Document uploaded successfully",
        });

        resolve(newDoc.id);
      };
      reader.readAsArrayBuffer(fileToRead);
    });
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const isPDForText = droppedFile.type === 'application/pdf' || droppedFile.type.startsWith('text/');
      if (!isPDForText) {
        toast({
          title: "Error",
          description: "Please drop a valid PDF or text file",
          variant: "destructive"
        });
        return;
      }
      const newId = await readAndAddDocument(droppedFile);
      if (newId) {
        router.push(`/documents/${newId}`);
      }
    }
  };

  const handleDeleteRequest = (doc: Document) => {
    setDeleteDoc(doc);
    setConfirmationText('');
  };

  const handleDeleteConfirm = () => {
    if (!deleteDoc) return;
    if (confirmationText.trim() === deleteDoc.name) {
      const filtered = documents.filter(d => d.id !== deleteDoc.id);
      setDocuments(filtered);
      localStorage.setItem('documents', JSON.stringify(filtered));
      toast({
        title: "Deleted",
        description: "Document was deleted",
      });
      setDeleteDoc(null);
    } else {
      toast({
        title: "Error",
        description: `Confirmation text does not match '${deleteDoc.name}'.`,
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = (doc: Document) => {
    const copy: Document = {
      ...doc,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      draft: true,
      name: doc.name + " (Copy)"
    };
    const updatedDocs = [...documents, copy];
    setDocuments(updatedDocs);
    localStorage.setItem('documents', JSON.stringify(updatedDocs));
    toast({
      title: "Duplicated",
      description: "Document was duplicated",
    });
  };

  const handleDownload = (doc: Document) => {
    if (doc.type === 'pdf' && doc.pdfData) {
      const uint8Array = new Uint8Array(doc.pdfData);
      const blob = new Blob([uint8Array], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name || 'document.pdf';
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Download Started",
        description: `${doc.name} is being downloaded.`,
      });
    } else if (doc.type === 'text') {
      const blob = new Blob([doc.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name || 'document.txt';
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Download Started",
        description: `${doc.name} is being downloaded.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Unsupported file type for download.",
        variant: "destructive",
      });
    }
  };

  const handleRename = (doc: Document) => {
    setRenameDoc(doc);
    setNewName(doc.name);
  };

  const handleRenameSubmit = () => {
    if (renameDoc && newName.trim().length > 0) {
      const updatedDocs = documents.map(d => d.id === renameDoc.id ? { ...d, name: newName.trim() } : d);
      setDocuments(updatedDocs);
      localStorage.setItem('documents', JSON.stringify(updatedDocs));
      toast({
        title: "Renamed",
        description: `Document renamed to ${newName.trim()}.`,
      });
      setRenameDoc(null);
      setNewName('');
    }
  };

  const drafts = documents.filter(doc => doc.draft);
  const completed = documents.filter(doc => !doc.draft);
  const inbox = [];
  const pending = [];

  const remaining = 5 - documents.length;
  const filters = [
    { label: 'Inbox', count: inbox.length, active: false, icon: Inbox },
    { label: 'Pending', count: pending.length, active: false, icon: Clock },
    { label: 'Completed', count: completed.length, active: false, icon: CheckCircle2 },
    { label: 'Draft', count: drafts.length, active: false, icon: FileText },
    { label: 'All', count: documents.length, active: true, icon: null },
  ];

  const openFileDialog = () => {
    if (remaining <= 0) {
      toast({
        title: "Limit Reached",
        description: "You have reached the document limit.",
        variant: "destructive"
      });
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <>
      <main className="min-h-screen bg-white text-black p-6">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Top Drop zone area */}
          <Card
            className={cn(
              "p-8 border-dashed border-2 bg-white relative transition-colors duration-200 cursor-pointer hover:bg-blue-50",
              isDragging ? "border-blue-600 bg-blue-50" : "border-blue-600"
            )}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.rtf,.html"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <CardHeader className="text-center space-y-2">
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center justify-center w-14 h-20 border-2 border-blue-600 rounded-lg mx-1" />
                <div className="flex flex-col items-center justify-center w-14 h-20 border-2 border-blue-600 rounded-lg mx-1">
                  <Upload className="text-blue-600" size={24} />
                </div>
                <div className="flex items-center justify-center w-14 h-20 border-2 border-blue-600 rounded-lg mx-1" />
              </div>
              <CardTitle className="text-xl font-semibold">Add a document</CardTitle>
              <p className="text-sm text-gray-600">
                Drag & drop your PDF here or click anywhere here to choose a file.
              </p>
              {remaining <= 0 ? (
                <span className="text-xs text-gray-500 block">You have reached the document limit.</span>
              ) : (
                <span className="text-xs text-gray-500 block">{remaining} of 5 documents remaining.</span>
              )}
            </CardHeader>
            <CardContent className="text-center" />
          </Card>

          {/* Documents Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              {filters.map((f, idx) => (
                <Button
                  key={idx}
                  variant={f.active ? "default" : "outline"}
                  className="flex items-center space-x-1 text-sm"
                >
                  {f.icon && <f.icon className={cn("w-4 h-4", f.active ? "text-black" : "text-gray-500")} />}
                  <span>{f.label} {f.count > 0 && f.count}</span>
                </Button>
              ))}
            </div>

            <div className="flex items-center space-x-2 ml-auto">
              <div className="flex items-center space-x-2">
                <select
                  className="bg-white border border-gray-300 text-gray-700 text-sm rounded px-2 py-1 focus:outline-none"
                >
                  <option>All Time</option>
                  <option>Today</option>
                  <option>This Week</option>
                </select>
              </div>
              <div className="flex items-center px-2 py-1 border border-gray-300 rounded space-x-2 bg-white">
                <Search className="text-gray-500 w-4 h-4"/>
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="bg-transparent text-sm text-gray-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Documents Table */}
          <div className="w-full overflow-auto border border-gray-300 rounded-lg bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="font-semibold text-xs text-gray-700 uppercase">Created</TableHead>
                  <TableHead className="font-semibold text-xs text-gray-700 uppercase">Title</TableHead>
                  <TableHead className="font-semibold text-xs text-gray-700 uppercase">Signers</TableHead>
                  <TableHead className="font-semibold text-xs text-gray-700 uppercase">Status</TableHead>
                  <TableHead className="font-semibold text-xs text-gray-700 uppercase">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                      No documents found.
                    </TableCell>
                  </TableRow>
                )}
                {documents.map((doc) => {
                  const dateStr = format(new Date(doc.createdAt), "MM/dd/yyyy, h:mm a");
                  const statusText = doc.draft ? 'Draft' : 'Completed';
                  const StatusIcon = doc.draft ? FileText : CheckCircle2;

                  return (
                    <TableRow key={doc.id} className="hover:bg-gray-50">
                      <TableCell className="whitespace-nowrap text-gray-700">{dateStr}</TableCell>
                      <TableCell className="whitespace-nowrap text-gray-900 font-medium">
                        <Link href={`/documents/${doc.id}`} className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span>{doc.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Link href={`/documents/${doc.id}/signers`} className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-black flex items-center justify-center border text-sm font-bold z-20">
                            JG
                          </div>
                          <div className="w-8 h-8 -ml-6 rounded-full bg-green-600 text-black flex items-center border justify-center text-sm font-bold z-10" />
                          <div className="w-8 h-8 -ml-6 rounded-full bg-yellow-600 text-black flex items-center border justify-center text-sm font-bold z-1" />
                          <span className="ml-2 text-gray-700">+6 more</span>
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-gray-700">
                        <div className="flex items-center space-x-1">
                          <StatusIcon className={`w-4 h-4 ${doc.draft ? 'text-yellow-500' : 'text-blue-600'}`} />
                          <span>{statusText}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {doc.draft ? (
                            <Button variant="outline" size="default" asChild>
                                <Link href={`/documents/${doc.id}/edit`} className="flex items-center space-x-2">
                                  <Edit className="w-4 h-4" />
                                  <span>Edit</span>
                                </Link>
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              className="flex items-center space-x-1"
                              onClick={() => handleDownload(doc)}
                            >
                              <DownloadIcon className="w-4 h-4" />
                              <span>Download</span>
                            </Button>
                          )}

                          {/* Dropdown Menu for More actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="p-1">
                                <MoreHorizontal className="w-5 h-5 text-gray-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-48">
                              <DropdownMenuLabel>Action</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/documents/${doc.id}`} className="flex items-center space-x-2">
                                  <Eye className="w-4 h-4" />
                                  <span>View</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/documents/${doc.id}/edit`} className="flex items-center space-x-2">
                                  <Edit className="w-4 h-4" />
                                  <span>Edit</span>
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleDownload(doc)} className="flex items-center space-x-2">
                                <DownloadIcon className="w-4 h-4" />
                                <span>Download</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleDuplicate(doc)} className="flex items-center space-x-2">
                                <Copy className="w-4 h-4" />
                                <span>Duplicate</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleRename(doc)} className="flex items-center space-x-2">
                                <Pencil className="w-4 h-4" />
                                <span>Rename</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onSelect={() => handleDeleteRequest(doc)} 
                                className="flex items-center space-x-2 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {documents.length > 0 && (
              <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 border-t border-gray-300">
                <span>Showing {documents.length} results.</span>
                <div className="flex items-center space-x-2">
                  <span>Rows per page</span>
                  <select className="bg-white border border-gray-300 text-gray-700 text-xs rounded px-1 py-0.5 focus:outline-none">
                    <option>20</option>
                    <option>50</option>
                    <option>100</option>
                  </select>
                  <span>Page 1 of 1</span>
                  <div className="flex space-x-1">
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-500 text-xs">&lt;&lt;</button>
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-500 text-xs">&lt;</button>
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-500 text-xs">&gt;</button>
                    <button className="p-1 hover:bg-gray-100 rounded text-gray-500 text-xs">&gt;&gt;</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Rename Dialog */}
      <Dialog open={Boolean(renameDoc)} onOpenChange={() => setRenameDoc(null)}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 bg-black/30" />
          <DialogContent className="fixed top-1/2 left-1/2 w-full max-w-sm p-0 transform -translate-x-1/2 -translate-y-1/2">
            <Card>
              <CardHeader>
                <CardTitle>Rename Document</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="New Document Name"
                />
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setRenameDoc(null)}>Cancel</Button>
                <Button onClick={handleRenameSubmit}>Save</Button>
              </CardFooter>
            </Card>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteDoc)} onOpenChange={() => setDeleteDoc(null)}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 bg-black/30" />
          <DialogContent className="fixed top-1/2 left-1/2 w-full max-w-sm p-0 transform -translate-x-1/2 -translate-y-1/2">
            <Card>
              <CardHeader>
                <CardTitle>Confirm Deletion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>To confirm, type <strong>{deleteDoc?.name}</strong> in the box below:</p>
                <Input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder={`Type ${deleteDoc?.name} exactly`}
                />
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDeleteDoc(null)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
              </CardFooter>
            </Card>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
}
