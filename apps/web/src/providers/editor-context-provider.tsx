
import React, { createContext, useContext, useState, useRef } from 'react';
import { EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';
import { addListNodes } from 'prosemirror-schema-list';
import { schema } from 'prosemirror-schema-basic';

const baseNodes = schema.spec.nodes
const originalCodeBlockSpec = baseNodes.get("code_block")

const customCodeBlockSpec = {
  ...originalCodeBlockSpec,
  attrs: {
    language: {
      default: "Text"
    }
  }
}

const modifiedBaseNodes = baseNodes.update("code_block", customCodeBlockSpec)


const finalNodes = addListNodes(modifiedBaseNodes, "paragraph block*", "block");


export const extendedProseMirrorSchema = new Schema({
  nodes: finalNodes,
  marks: schema.spec.marks
});


interface EditorContextType {
  editorView: React.MutableRefObject<EditorView | null>;
  isEditorReady: boolean;
  setEditorReady: (ready: boolean) => void;
  insertTextAtCursor: (text: string) => void;
  replaceText: (from: number, to: number, text: string) => void;
  getCurrentContent: () => string | null;
  customDispatchTransaction: (tr: any) => void
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const editorView = useRef<EditorView | null>(null);
  const [isEditorReady, setEditorReady] = useState(false);

  
  const insertTextAtCursor = (text: string) => {
    if (!editorView.current) return;

    const { state } = editorView.current;
    const { tr } = state;
    const transaction = tr.insertText(text, state.selection.from);
    editorView.current.dispatch(transaction);
  };

  
  const replaceText = (from: number, to: number, text: string) => {
    if (!editorView.current) return;

    const { state } = editorView.current;
    const { tr } = state;
    const transaction = tr.replaceWith(from, to, state.schema.text(text));
    editorView.current.dispatch(transaction);
  };

  
  const getCurrentContent = (): string | null => {
    if (!editorView.current) return null;
    
    const { state } = editorView.current;
    let content = '';
    state.doc.forEach(node => {
      content += node.textContent;
    });
    
    return content;
  };

  const customDispatchTransaction = (tr: any) => {
    if(!editorView.current) return

    editorView.current.dispatch(tr)
  }

  return (
    <EditorContext.Provider
      value={{
        editorView,
        isEditorReady,
        setEditorReady,
        insertTextAtCursor,
        replaceText,
        getCurrentContent,
        customDispatchTransaction
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};


export const useEditor = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};