'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import 'react-quill-new/dist/quill.snow.css';

// Import ReactQuill dynamically to prevent SSR issues
const ReactQuill = dynamic(
  () =>
    import('react-quill-new').then((mod) => {
      return mod.default;
    }),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full bg-white/5 border border-white/20 rounded-lg animate-pulse" />
    ),
  }
);

// Standard Quill toolbar configuration
const quillModules = {
  toolbar: [
    [{ header: [3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    ['link', 'code-block'],
    ['clean'],
  ],
  clipboard: {
    matchVisual: false,
  },
  keyboard: {
    bindings: {
      tab: false,
    },
  },
};

const quillFormats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'indent',
  'link',
  'code-block',
];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something awesome...',
  className = '',
}: RichTextEditorProps) {
  // State to track if we're client-side (for ReactQuill loading)
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting for ReactQuill
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-64 w-full bg-white/5 border border-white/20 rounded-lg animate-pulse" />
    );
  }

  return (
    <ReactQuill
      theme="snow"
      modules={quillModules}
      formats={quillFormats}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`bg-white/5 rounded-lg ${className}`}
    />
  );
}
