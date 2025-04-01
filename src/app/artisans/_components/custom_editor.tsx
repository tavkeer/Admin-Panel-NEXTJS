"use client";

import React, { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css"; 

type CustomEditorProps = {
  value: string;
  onChange: (content: string) => void;
};

const CustomEditor: React.FC<CustomEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null); 

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return; 

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


    quillRef.current.root.innerHTML = value;


    quillRef.current.on("text-change", () => {
      if (quillRef.current) {
        onChange(quillRef.current.root.innerHTML);
      }
    });
  }, []);


  useEffect(() => {
    if (quillRef.current && quillRef.current.root.innerHTML !== value) {
      quillRef.current.root.innerHTML = value;
    }
  }, [value]);

  return <div ref={editorRef} style={{ height: "150px", backgroundColor: "#fff" }}></div>;
};

export default CustomEditor;
