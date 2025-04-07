

import type { EditorView } from "prosemirror-view";
import type { MarkType } from "prosemirror-model"; 


export const boldText = (editorView: EditorView, apply: boolean): void => {
    console.log("Toggling Bold, apply:", apply);
    const { state } = editorView;
    const { selection, schema, tr } = state;
    const { from, to } = selection;

    
    const resolvedFrom = Math.min(from, to);
    const resolvedTo = Math.max(from, to);

    
    if (resolvedFrom === resolvedTo) {
        console.log("Bold: No selection, doing nothing.");
        return;
    }

    const markType: MarkType | undefined = schema.marks.strong; 
    if (!markType) {
        console.warn("Schema missing 'strong' mark type for bold.");
        return;
    }

    console.log(`Bold: Modifying range ${resolvedFrom}-${resolvedTo}`);
    if (apply) {
        tr.addMark(resolvedFrom, resolvedTo, markType.create());
    } else {
        
        tr.removeMark(resolvedFrom, resolvedTo, markType);
    }
    editorView.dispatch(tr);
    
};


export const italicizeText = (editorView: EditorView, apply: boolean): void => {
    console.log("Toggling Italic, apply:", apply);
    const { state } = editorView;
    const { selection, schema, tr } = state;
    const { from, to } = selection;

    const resolvedFrom = Math.min(from, to);
    const resolvedTo = Math.max(from, to);

    if (resolvedFrom === resolvedTo) {
        console.log("Italic: No selection, doing nothing.");
        return;
    }

    const markType: MarkType | undefined = schema.marks.em; 
    if (!markType) {
        console.warn("Schema missing 'em' mark type for italic.");
        return;
    }

    console.log(`Italic: Modifying range ${resolvedFrom}-${resolvedTo}`);
    if (apply) {
        tr.addMark(resolvedFrom, resolvedTo, markType.create());
    } else {
        
        tr.removeMark(resolvedFrom, resolvedTo, markType);
    }
    editorView.dispatch(tr);
    
};


export const underlineText = (editorView: EditorView, apply: boolean): void => {
    console.log("Toggling Underline, apply:", apply);
    const { state } = editorView;
    const { selection, schema, tr } = state;
    const { from, to } = selection;

    const resolvedFrom = Math.min(from, to);
    const resolvedTo = Math.max(from, to);

    if (resolvedFrom === resolvedTo) {
        console.log("Underline: No selection, doing nothing.");
        return;
    }

    
    const markType: MarkType | undefined = schema.marks.underline_mark;
    const mark = markType.create()
    console.log("MARK IS: ", mark)
    console.log("Mark type is: ", markType)
    if (!markType) {
        console.warn("Schema missing 'underline' mark type.");
        return;
    }

    console.log(`Underline: Modifying range ${resolvedFrom}-${resolvedTo}`);
    if (apply) {
        tr.addMark(resolvedFrom, resolvedTo, markType.create());
    } else {
        
        tr.removeMark(resolvedFrom, resolvedTo, markType);
    }
    editorView.dispatch(tr);
    
};


export const strikethroughText = (editorView: EditorView, apply: boolean): void => {
    console.log("Toggling Strikethrough, apply:", apply);
    const { state } = editorView;
    const { selection, schema, tr } = state;
    const { from, to } = selection;

    const resolvedFrom = Math.min(from, to);
    const resolvedTo = Math.max(from, to);

    if (resolvedFrom === resolvedTo) {
        console.log("Strikethrough: No selection, doing nothing.");
        return;
    }

    
    const markType: MarkType | undefined = schema.marks.strikethrough;
    if (!markType) {
        console.warn("Schema missing 'strikethrough' mark type.");
        return;
    }

    console.log(`Strikethrough: Modifying range ${resolvedFrom}-${resolvedTo}`);
    if (apply) {
        tr.addMark(resolvedFrom, resolvedTo, markType.create());
    } else {
        
        tr.removeMark(resolvedFrom, resolvedTo, markType);
    }
    editorView.dispatch(tr);
    
};





export const setTextColor = (editorView: EditorView, color: string): void => {
    console.log("Setting text color to:", color);
    const { state } = editorView;
    const { selection, schema, tr } = state;
    const { from, to } = selection;
    
    const resolvedFrom = Math.min(from, to);
    const resolvedTo = Math.max(from, to);
    
    if (resolvedFrom === resolvedTo) {
      console.log("Text color: No selection, doing nothing.");
      return;
    }
    
    const markType: MarkType | undefined = schema.marks.text_color;
    
    if (!markType) {
      console.warn("Schema missing 'text_color' mark type.");
      return;
    }
    
    console.log(`Text color: Modifying range ${resolvedFrom}-${resolvedTo}`);
    tr.addMark(resolvedFrom, resolvedTo, markType.create({ color }));
    editorView.dispatch(tr);
  };
  
  
  export const setHighlightColor = (editorView: EditorView, color: string): void => {
    console.log("Setting highlight color to:", color);
    const { state } = editorView;
    const { selection, schema, tr } = state;
    const { from, to } = selection;
    
    const resolvedFrom = Math.min(from, to);
    const resolvedTo = Math.max(from, to);
    
    if (resolvedFrom === resolvedTo) {
      console.log("Highlight color: No selection, doing nothing.");
      return;
    }
    
    const markType: MarkType | undefined = schema.marks.highlight;
    
    if (!markType) {
      console.warn("Schema missing 'highlight' mark type.");
      return;
    }
    
    console.log(`Highlight color: Modifying range ${resolvedFrom}-${resolvedTo}`);
    tr.addMark(resolvedFrom, resolvedTo, markType.create({ color }));
    editorView.dispatch(tr);
  };
  
  
  export const superscriptText = (editorView: EditorView, apply: boolean): void => {
    console.log("Toggling Superscript, apply:", apply);
    const { state } = editorView;
    const { selection, schema, tr } = state;
    const { from, to } = selection;
    
    const resolvedFrom = Math.min(from, to);
    const resolvedTo = Math.max(from, to);
    
    if (resolvedFrom === resolvedTo) {
      console.log("Superscript: No selection, doing nothing.");
      return;
    }
    
    const markType: MarkType | undefined = schema.marks.superscript;
    
    if (!markType) {
      console.warn("Schema missing 'superscript' mark type.");
      return;
    }
    
    console.log(`Superscript: Modifying range ${resolvedFrom}-${resolvedTo}`);
    if (apply) {
      tr.addMark(resolvedFrom, resolvedTo, markType.create());
    } else {
      tr.removeMark(resolvedFrom, resolvedTo, markType);
    }
    editorView.dispatch(tr);
  };
  
  
  export const subscriptText = (editorView: EditorView, apply: boolean): void => {
    console.log("Toggling Subscript, apply:", apply);
    const { state } = editorView;
    const { selection, schema, tr } = state;
    const { from, to } = selection;
    
    const resolvedFrom = Math.min(from, to);
    const resolvedTo = Math.max(from, to);
    
    if (resolvedFrom === resolvedTo) {
      console.log("Subscript: No selection, doing nothing.");
      return;
    }
    
    const markType: MarkType | undefined = schema.marks.subscript;
    
    if (!markType) {
      console.warn("Schema missing 'subscript' mark type.");
      return;
    }
    
    console.log(`Subscript: Modifying range ${resolvedFrom}-${resolvedTo}`);
    if (apply) {
      tr.addMark(resolvedFrom, resolvedTo, markType.create());
    } else {
      tr.removeMark(resolvedFrom, resolvedTo, markType);
    }
    editorView.dispatch(tr);
  };
  
  
  export const applyHeading = (editorView: EditorView, level: number): void => {
    console.log("Applying heading level:", level);
    const { state } = editorView;
    const { selection, schema, tr } = state;
    
    const nodeType = level === 0 ? schema.nodes.paragraph : schema.nodes.heading;
    
    if (!nodeType) {
      console.warn(`Schema missing '${level === 0 ? 'paragraph' : 'heading'}' node type.`);
      return;
    }
    
    const attrs = level === 0 ? {} : { level };
    
    const { $from, $to } = selection;
    const range = $from.blockRange($to);
    
    if (!range) {
      console.log("Heading: No valid block range, doing nothing.");
      return;
    }
    
    const transaction = tr.setBlockType(range.start, range.end, nodeType, attrs);
    editorView.dispatch(transaction);
  };

  export const insertLink = (editorView: EditorView, linkText: string, linkUrl: string) => {
    const { state } = editorView;
    const { selection, schema, tr } = state;
    const { from, to } = selection;
    
    const resolvedFrom = Math.min(from, to);
    const resolvedTo = Math.max(from, to);
    
    
    const linkMarkType = schema.marks.link;
    
    if (!linkMarkType) {
      console.warn("Schema missing 'link' mark type.");
      return;
    }
    
    
    if (resolvedFrom === resolvedTo) {
      console.log("InsertLink: No selection, inserting at cursor position");
      
      
      const textNode = schema.text(linkText);
      tr.insert(resolvedFrom, textNode);
      
      
      tr.addMark(
        resolvedFrom, 
        resolvedFrom + linkText.length, 
        linkMarkType.create({ href: linkUrl })
      );
    } else {
      
      console.log(`InsertLink: Replacing selection from ${resolvedFrom} to ${resolvedTo}`);
      
      
      if (linkText && linkText.trim() !== '') {
        tr.replaceWith(resolvedFrom, resolvedTo, schema.text(linkText));
        
        
        tr.addMark(
          resolvedFrom, 
          resolvedFrom + linkText.length, 
          linkMarkType.create({ href: linkUrl })
        );
      } else {
        
        tr.addMark(
          resolvedFrom, 
          resolvedTo, 
          linkMarkType.create({ href: linkUrl })
        );
      }
    }
    
    
    editorView.dispatch(tr);
  }
  
  
  export const setTextAlignment = (editorView: EditorView, alignment: 'left' | 'center' | 'right' | 'justify'): void => {
    console.log("Setting text alignment to:", alignment);
    const { state } = editorView;
    const { selection, schema, tr } = state;
    
    const { $from, $to } = selection;
    const range = $from.blockRange($to);
    
    if (!range) {
      console.log("Alignment: No valid block range, doing nothing.");
      return;
    }
    
    
    const transaction = tr.setNodeMarkup(range.start, null, { 
      ...tr.doc.nodeAt(range.start)?.attrs,
      align: alignment 
    });
    
    editorView.dispatch(transaction);
  };
  
  
  export const toggleBlockquote = (editorView: EditorView): void => {
    console.log("Toggling blockquote");
    const { state } = editorView;
    const { selection, schema, tr } = state;
    
    const { $from, $to } = selection;
    const range = $from.blockRange($to);
    
    if (!range) {
      console.log("Blockquote: No valid block range, doing nothing.");
      return;
    }
    
    
    const isInBlockquote = range.parent.type === schema.nodes.blockquote;
    
    if (isInBlockquote) {
      
      const transaction = tr.lift(range, 0);
      editorView.dispatch(transaction);
    } else {
      
      const blockquoteType = schema.nodes.blockquote;
      if (!blockquoteType) {
        console.warn("Schema missing 'blockquote' node type.");
        return;
      }
      
      const canWrap = range && range.depth >= 1;
      if (!canWrap) {
        console.log("Cannot wrap in blockquote, invalid range or depth.");
        return;
      }
      
      const transaction = tr.wrap(range, [{ type: blockquoteType }]);
      editorView.dispatch(transaction);
    }
  };
  
  
  export const toggleList = (editorView: EditorView, listType: 'bullet_list' | 'ordered_list'): void => {
    console.log(`Toggling ${listType}`);
    const { state } = editorView;
    const { selection, schema, tr } = state;
    
    const { $from, $to } = selection;
    const range = $from.blockRange($to);
    
    if (!range) {
      console.log("List: No valid block range, doing nothing.");
      return;
    }
    
    const nodeType = schema.nodes[listType];
    const listItemType = schema.nodes.list_item;
    
    if (!nodeType || !listItemType) {
      console.warn(`Schema missing '${listType}' or 'list_item' node type.`);
      return;
    }
    
    
    const isInList = range.parent.type === nodeType;
    
    if (isInList) {
      
      const transaction = tr.lift(range, 0);
      editorView.dispatch(transaction);
    } else {
      
      const canWrap = range && range.depth >= 1;
      if (!canWrap) {
        console.log(`Cannot wrap in ${listType}, invalid range or depth.`);
        return;
      }
      
      const transaction = tr.wrap(range, [{ type: nodeType }, { type: listItemType }]);
      editorView.dispatch(transaction);
    }
  };