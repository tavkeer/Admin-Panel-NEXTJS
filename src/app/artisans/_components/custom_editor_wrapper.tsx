// QuillEditorWrapper.tsx
"use client";

import dynamic from "next/dynamic";

const DynamicQuillEditor = dynamic(() => import("./custom_editor"), {
  ssr: false,
  loading: () => <div>Loading editor...</div>,
});

interface QuillEditorWrapperProps {
  value: string;
  onChange: (value: string) => void;
}

export default function QuillEditorWrapper({
  value,
  onChange,
}: QuillEditorWrapperProps) {
  return <DynamicQuillEditor value={value} onChange={onChange} />;
}
