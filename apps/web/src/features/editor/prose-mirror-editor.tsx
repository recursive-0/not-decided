"use client"

import { useEffect, useRef } from "react"
import { EditorView, Decoration, DecorationSet } from "prosemirror-view"
import { EditorState, Plugin, PluginKey } from "prosemirror-state"
import { Schema } from "prosemirror-model"
import { schema as basicSchema, schema } from "prosemirror-schema-basic"
import { addListNodes } from "prosemirror-schema-list"
import { extendedProseMirrorSchema, useEditor } from "@/providers/editor-context-provider"
import "./prosemirror-styles.css"

// // Create an extended schema that includes heading nodes
// const schema = new Schema({
//   nodes: addListNodes(basicSchema.spec.nodes, "paragraph block*", "block"),
//   marks: basicSchema.spec.marks
// })


const characterPluginKey = new PluginKey('character-animation')

// Create our animation plugin
const characterPlugin = new Plugin({
    key: characterPluginKey,
    
    state: {
        init() {
            return {
                newlyInsertedRanges: [] // Track ranges of inserted content
            }
        },
        
        apply(tr, value, oldState, newState) {
            // Reset the tracking if we're not in a transaction chain
            if (!tr.docChanged) {
                // Clear animations after they've had time to play
                if (value.newlyInsertedRanges.length && !tr.getMeta('animating')) {
                    return { newlyInsertedRanges: [] }
                }
                return value
            }
            
            // Track newly inserted content
            const newRanges = []
            tr.mapping.maps.forEach(map => {
                map.forEach((oldStart, oldEnd, newStart, newEnd) => {
                    if (newEnd > newStart && (oldEnd - oldStart) < (newEnd - newStart)) {
                        // This is an insertion
                        newRanges.push({ from: newStart, to: newEnd })
                    }
                })
            })
            
            // Map old ranges through the transaction
            const mappedOldRanges = value.newlyInsertedRanges.map(range => {
                return {
                    from: tr.mapping.map(range.from),
                    to: tr.mapping.map(range.to)
                }
            })
            
            return {
                newlyInsertedRanges: [...mappedOldRanges, ...newRanges]
            }
        }
    },

    props: {
        decorations(state) {
            const { newlyInsertedRanges } = this.getState(state)
            if (!newlyInsertedRanges.length) return null
            
            const decorations = []
            
            // For each inserted range, create character-by-character decorations
            newlyInsertedRanges.forEach(range => {
                let charIndex = 0
                
                state.doc.nodesBetween(range.from, range.to, (node, pos) => {
                    if (!node.isText) return true
                    
                    const startPos = Math.max(range.from, pos)
                    const endPos = Math.min(range.to, pos + node.nodeSize)
                    
                    for (let i = startPos; i < endPos; i++) {
                        if (i >= pos && i < pos + node.text.length) {
                            // Get the actual character
                            const charPos = i - pos;
                            const char = node.text[charPos];
                            
                            // Handle spaces specially
                            const isSpace = char === ' ';
                            
                            decorations.push(
                                Decoration.inline(i, i + 1, {
                                    class: isSpace ? 'animated-space' : 'animated-char',
                                    style: `
                                        display: inline-block;
                                        opacity: 0;
                                        animation: typeIn 0.1s forwards;
                                        animation-delay: ${charIndex * 2}ms;
                                    `
                                })
                            )
                            charIndex++
                        }
                    }
                    
                    return true
                })
            })
            
            return DecorationSet.create(state.doc, decorations)
        }
    }
})



// Our dummy content to insert
const dummyContent = {
    type: "doc",
    content: [{
        type: "heading",
        attrs: { level: 1 },
        content: [{
            type: "text",
            text: "The best cursor for docs yeah am sure this is the best cursor for docs with my own touch"
        }]
    }]
}

export const ProseMirrorEditor = () => {
    const editorRef = useRef<HTMLDivElement | null>(null)
    const { editorView, setEditorReady } = useEditor()

    const insertNode = () => {
        if (!editorView.current) return

        const tr = editorView.current.state.tr
        const node = schema.nodeFromJSON(dummyContent)
        const pos = editorView.current.state.selection.from
        
        tr.insert(pos, node)
        editorView.current.dispatch(tr)
        
        // Schedule clearing the animations after they've had time to play
        setTimeout(() => {
            const clearTr = editorView.current.state.tr
            clearTr.setMeta('animating', false)
            editorView.current.dispatch(clearTr)
        }, 3000) // Adjust timing as needed
    }

    useEffect(() => {
const style = document.createElement('style')
style.textContent = `
    .ProseMirror {
        /* Add perspective to the container */
        perspective: 1000px;
        transform-style: preserve-3d;
    }

    .animated-char {
        display: inline-block;
        will-change: transform, opacity;
        /* Move transform origin up a bit */
        transform-origin: top center;
        /* Ensure the character maintains its natural dimensions */
        vertical-align: baseline;
        position: relative;
    }

    @keyframes typeIn {
        from {
            opacity: 0;
            /* Use a gentler transform that won't stretch */
            transform: translateY(8px) rotateX(30deg) scale(0.95);
        }
        to {
            opacity: 1;
            transform: translateY(0) rotateX(0) scale(1);
        }
    }

    /* Special handling for spaces to maintain consistent width */
    .animated-space {
        display: inline-block;
        width: 0.25em;
        white-space: pre;
        position: relative;
    }
`
        document.head.appendChild(style)
        return () => style.remove()
    }, [])

    useEffect(() => {
        if (!editorRef.current) return

        const state = EditorState.create({
            schema: extendedProseMirrorSchema,
            plugins: [characterPlugin]
        })

        if (!editorView.current && editorRef.current) {
            editorView.current = new EditorView(editorRef.current, {
                state,
                dispatchTransaction: (transaction) => {
                    const newState = editorView.current.state.apply(transaction)
                    editorView.current.updateState(newState)
                }
            })
            
            setEditorReady(true)
        }

        return () => {
            if (editorView.current) {
                editorView.current.destroy()
                editorView.current = null
                setEditorReady(false)
            }
        }
    }, [editorView, setEditorReady])

    return (
        <div className="flex flex-col w-full h-full">
            <button 
                onClick={insertNode}
                className="px-4 py-2 bg-blue-500 text-white rounded mb-4"
            >
                Insert
            </button>
            <div 
                className="prosemirror-editor w-full h-full p-4 rounded border" 
                ref={editorRef} 
            />
        </div>
    )
}