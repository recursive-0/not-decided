"use client"

import { useEffect, useRef, useState } from "react"
import { EditorView } from "prosemirror-view"
import { EditorState, Transaction } from "prosemirror-state"
import { schema } from "prosemirror-schema-basic"
import { Schema, Node } from "prosemirror-model"
import { useSSEStream } from "@/hooks/use-sse-stream"


export const ProseMirrorEditor = () => {
    const editorRef = useRef<HTMLDivElement | null>(null)
    const viewRef = useRef<EditorView | null>(null)
    const { startStreaming, stopStreaming, isLoading } = useSSEStream()
    const [prompt, setPrompt] = useState("")

    useEffect(() => {
        if (!editorRef.current) return

        const state = EditorState.create({
            schema: schema,
            doc: schema.node("doc", null, [
                schema.node("paragraph", null, [
                    schema.text("The best cursor for docs ")
                ])
            ])
        })

        if (!viewRef.current && editorRef.current) {
            viewRef.current = new EditorView(editorRef.current, {
                state: state,
                dispatchTransaction: (transaction) => {
                    const newState = viewRef.current!.state.apply(transaction)
                    viewRef.current?.updateState(newState)
                }
            })
        }

        return () => {
            if (viewRef.current) {
                viewRef.current.destroy()
                viewRef.current = null
            }
        }
    }, [])

    const handleTokenReceived = (token: string) => {
        // If view exists, insert the token
        if (viewRef.current) {
            const { state } = viewRef.current
            const { tr } = state
            
            // Get the current document size to insert at the end
            const docSize = state.doc.content.size
            const insertPos = docSize - 2 // Insert at the end of content
            
            // Create a transaction that inserts text at the end
            const transaction = tr.insertText(token, insertPos)
            
            // Apply the transaction
            viewRef.current.dispatch(transaction)
        }
    }

    const handleAskAI = () => {
        if (prompt.trim() && !isLoading) {
            startStreaming(prompt, handleTokenReceived)
        }
    }

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="prosemirror-editor w-full h-64 border p-4 rounded" ref={editorRef} />
            
            <div className="flex gap-2">
                <input 
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask AI something..."
                    className="flex-1 p-2 border rounded"
                />
                <button 
                    onClick={handleAskAI}
                    disabled={isLoading || !prompt.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
                >
                    {isLoading ? "Generating..." : "Ask AI"}
                </button>
                {isLoading && (
                    <button 
                        onClick={stopStreaming}
                        className="px-4 py-2 bg-red-500 text-white rounded"
                    >
                        Stop
                    </button>
                )}
            </div>
        </div>
    )
}