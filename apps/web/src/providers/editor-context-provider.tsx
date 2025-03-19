// src/contexts/EditorContext.tsx
import React, { createContext, useContext, useState, useRef } from 'react';
import { EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';
import { addListNodes } from 'prosemirror-schema-list';
import { schema } from 'prosemirror-schema-basic';


export const extendedProseMirrorSchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
  marks: schema.spec.marks
})

interface EditorContextType {
  editorView: React.MutableRefObject<EditorView | null>;
  isEditorReady: boolean;
  setEditorReady: (ready: boolean) => void;
  insertTextAtCursor: (text: string) => void;
  replaceText: (from: number, to: number, text: string) => void;
  getCurrentContent: () => string | null;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const editorView = useRef<EditorView | null>(null);
  const [isEditorReady, setEditorReady] = useState(false);

  // Insert text at the current cursor position
  const insertTextAtCursor = (text: string) => {
    if (!editorView.current) return;

    const { state } = editorView.current;
    const { tr } = state;
    const transaction = tr.insertText(text, state.selection.from);
    editorView.current.dispatch(transaction);
  };

  // Replace text in a specific range
  const replaceText = (from: number, to: number, text: string) => {
    if (!editorView.current) return;

    const { state } = editorView.current;
    const { tr } = state;
    const transaction = tr.replaceWith(from, to, state.schema.text(text));
    editorView.current.dispatch(transaction);
  };

  // Get the current document content as a string
  const getCurrentContent = (): string | null => {
    if (!editorView.current) return null;
    
    const { state } = editorView.current;
    let content = '';
    state.doc.forEach(node => {
      content += node.textContent;
    });
    
    return content;
  };

  return (
    <EditorContext.Provider
      value={{
        editorView,
        isEditorReady,
        setEditorReady,
        insertTextAtCursor,
        replaceText,
        getCurrentContent
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

// Custom hook to use the editor context
export const useEditor = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};