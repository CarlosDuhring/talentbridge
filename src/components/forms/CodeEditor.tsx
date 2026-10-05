"use client";

import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { javascript } from "@codemirror/lang-javascript";
import { php } from "@codemirror/lang-php";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";

function languageExtension(language: string) {
  switch (language) {
    case "php":
      return php();
    case "python":
      return python();
    case "java":
      return java();
    default:
      return javascript();
  }
}

export function CodeEditor({
  value,
  language,
  onChange,
  height = 320,
}: {
  value: string;
  language: string;
  onChange: (value: string) => void;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;
    const state = EditorState.create({
      doc: value,
      extensions: [
        basicSetup,
        languageExtension(language),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });
    const view = new EditorView({
      state,
      parent: containerRef.current,
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-lg border border-black/[0.12] text-sm [&_.cm-editor]:outline-none"
      style={{ height }}
    />
  );
}
