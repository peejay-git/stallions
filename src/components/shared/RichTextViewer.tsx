'use client';

import { useEffect, useState } from 'react';
import 'react-quill-new/dist/quill.bubble.css';
import DOMPurify from 'dompurify';

interface RichTextViewerProps {
  content: string;
  className?: string;
}

export default function RichTextViewer({ 
  content, 
  className = '' 
}: RichTextViewerProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={`rich-text-viewer-skeleton ${className}`}>
        <div className="h-4 w-3/4 bg-white/5 rounded mb-2 animate-pulse"></div>
        <div className="h-4 w-full bg-white/5 rounded mb-2 animate-pulse"></div>
        <div className="h-4 w-5/6 bg-white/5 rounded mb-2 animate-pulse"></div>
        <div className="h-4 w-4/5 bg-white/5 rounded animate-pulse"></div>
      </div>
    );
  }

  // Sanitize the HTML content to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(content);

  return (
    <div 
      className={`rich-text-viewer ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
