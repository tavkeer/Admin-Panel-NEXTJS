"use client";

import React, { useEffect, useRef } from "react";
import Quill from "quill"; // Directly import quill instance
import "quill/dist/quill.snow.css"; // Snow theme for Quill editor

type CustomEditorProps = {
  value: string;
  onChange: (content: string) => void;
};

const CustomEditor: React.FC<CustomEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null); // Reference for editor element
  const quillRef = useRef<Quill | null>(null); // Store the Quill instance

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return; // Prevent reinitialization

    quillRef.current = new Quill(editorRef.current, {
      theme: "snow",
      modules: {
        toolbar: [
          [{ font: [] }, { size: [] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          ["link", "image", "code-block"],
        ],
      },
    });

    // Set initial value
    quillRef.current.root.innerHTML = value;

    // Listen for text changes
    quillRef.current.on("text-change", () => {
      if (quillRef.current) {
        onChange(quillRef.current.root.innerHTML);
      }
    });
  }, []);

  // Sync external value changes
  useEffect(() => {
    if (quillRef.current && quillRef.current.root.innerHTML !== value) {
      quillRef.current.root.innerHTML = value;
    }
  }, [value]);

  return <div ref={editorRef} style={{ height: "150px", backgroundColor: "#fff" }}></div>;
};

export default CustomEditor;
