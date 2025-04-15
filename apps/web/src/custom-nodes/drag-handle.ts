import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

const dragPluginKey = new PluginKey("drag-handle");

export const dragHandlePlugin = new Plugin({
  key: dragPluginKey,

  state: {
    init() {
      return { hoveringPos: null, isHovering: false };
    },
    apply(tr, value, oldState, newState) {
      const meta = tr.getMeta(dragPluginKey);
      if (meta) {
        return meta;
      }
      return value;
    }
  },

  props: {
    handleDOMEvents: {
      mousemove(view, event) {
        const { clientX, clientY } = event;
        const coords = view.coordsAtPos(view.posAtCoords({ left: clientX, top: clientY })?.pos);
        
        if (!coords) return false;

        // Find the node at current position
        const pos = view.posAtCoords({ left: clientX, top: clientY })?.pos;
        if (pos === undefined) return false;

        const $pos = view.state.doc.resolve(pos);
        const currentNode = $pos.node();
        
        // Get the start position of the current node
        const nodeStartPos = $pos.start($pos.depth);
        
        // Get the coordinates of the node's start
        const startCoords = view.coordsAtPos(nodeStartPos);
        
        const isNearStart = 
          clientX >= startCoords.left && 
          clientX <= startCoords.left + 400 && 
          clientY >= startCoords.top &&
          clientY <= startCoords.bottom;

        if (isNearStart) {
          view.dispatch(view.state.tr.setMeta(dragPluginKey, {
            hoveringPos: nodeStartPos,  // Store position, not coords!
            isHovering: true
          }));
        } else {
          // Clear hover state when not hovering
          const currentState = dragPluginKey.getState(view.state);
          if (currentState.isHovering) {
            view.dispatch(view.state.tr.setMeta(dragPluginKey, {
              hoveringPos: null,
              isHovering: false
            }));
          } else {
            view.dispatch(view.state.tr.setMeta(dragPluginKey, {
                hoveringPos: null,
                isHovering: false
              }));
          }
        }

        return false;
      }
    },
    decorations(state) {
      const pluginState = dragPluginKey.getState(state);
      
      if (!pluginState.isHovering || pluginState.hoveringPos === null) {
        return DecorationSet.empty;
      }

      const redBallElement = document.createElement('div');
      redBallElement.className = 'red-ball';
      // Add some basic styles inline for testing
      redBallElement.style.cssText = `
        width: 10px;
        height: 10px;
        background: red;
        border-radius: 10%;
        position: absolute;
        left: -20px;
        top: 8px;
      `;

      return DecorationSet.create(state.doc, [
        Decoration.widget(pluginState.hoveringPos, redBallElement, {
          side: -1,
          stopEvent: () => true  // Prevent events from reaching editor
        })
      ]);
    }
  }
});