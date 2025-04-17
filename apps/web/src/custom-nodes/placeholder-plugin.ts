import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";


const placeholderPluginKey = new PluginKey()

export const placeholderPlugin = new Plugin({

    key: placeholderPluginKey,

    props: {
        decorations(state) {

            const decorations: Decoration[] = []
            const { doc, selection } = state
            const isCursor = selection.empty
            if(isCursor){
                const { $head } = selection
                const showPlaceholder = $head.parent.type.name === "paragraph" && $head.parent.content.size === 0
                if(showPlaceholder){
                    const from = $head.start() - 1
                    const to = $head.end() + 1

                   const decorator = Decoration.node(from, to, { class: "is-empty"})
                   decorations.push(decorator)
                   return DecorationSet.create(state.doc, decorations)
                }
            }

            return DecorationSet.empty

        },
    }
})