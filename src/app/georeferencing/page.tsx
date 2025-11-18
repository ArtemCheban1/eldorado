"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamic import for the georeferencing component
const GeoreferencingTool = dynamic(() => import('@/components/GeoreferencingTool'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading georeferencing tool...</p>
      </div>
    </div>
  ),
});

export default function GeoreferencingPage() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Header */}
      <header className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Map
          </Link>
          <h1 className="text-2xl font-bold">Image Georeferencing</h1>
        </div>
        <div className="text-sm text-gray-400">
          Add control points to align your historical map with real-world coordinates
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <GeoreferencingTool />
      </main>
    </div>
  );
}
