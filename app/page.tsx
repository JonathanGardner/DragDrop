// app/page.tsx
"use client";

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Main Page</h1>
      <Link 
        href="/documents"
        className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
      >
        Open Documents
      </Link>
    </main>
  );
}
