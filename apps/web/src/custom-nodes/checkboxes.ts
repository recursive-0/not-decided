import type { Node as ProseMirrorNode } from "prosemirror-model"; // Renamed import to avoid conflict
import type { EditorView, NodeView } from "prosemirror-view";

export class CheckBoxes implements NodeView {
    public node: ProseMirrorNode; // Use the renamed type
    public view: EditorView;
    public getPos: () => number | undefined;

    // --- FIX: Change type to match NodeView interface ---
    public dom!: Node;
    public contentDOM:  HTMLElement | null | undefined = null
    // --- End Fix ---

    private boxElement: HTMLElement | null = null

    constructor(node: ProseMirrorNode, view: EditorView, getPos: () => number | undefined) {

        this.node = node;
        this.view = view;
        this.getPos = getPos;

        // Create the DOM structure - this assigns valid HTMLElements (which are Nodes)
        // to this.dom, this.contentDOM, and this.boxElement
        this.createCheckboxNode();

        // Now this.dom is typed as Node, but holds an HTMLElement.
        // If you need HTMLElement specific methods, use a type assertion:
        (this.dom as HTMLElement).setAttribute("data-checked", String(node.attrs.checked));

        // this.boxElement is already HTMLElement
        this.boxElement!.setAttribute("checked", String(node.attrs.checked));

        // Add click handler
        this.boxElement!.addEventListener("click", this.handleClick.bind(this));
    }

    createCheckboxNode(): void { // Explicit return type
        // Create container
        const container = document.createElement('div'); // This is an HTMLElement
        container.classList.add("checkbox-container");
        // Assign the HTMLElement to this.dom (which expects Node). This is valid!
        this.dom = container;

        // Create checkbox
        const box = document.createElement('span'); // HTMLElement
        box.classList.add("checkbox-box");
        this.boxElement = box; // Assign HTMLElement to HTMLElement

        // Create content wrapper
        const content = document.createElement("p"); // HTMLElement
        content.classList.add("checkbox-paragraph");
        // Assign HTMLElement to this.contentDOM (which expects Node | null). Valid!
        this.contentDOM = content;

        // Assemble structure
        this.dom.appendChild(this.boxElement); // Appending Node to Node (valid)
        this.dom.appendChild(this.contentDOM); // Appending Node | null (which is Node here) to Node (valid)
    }

    // ... (rest of the class remains largely the same, but use assertions like
    // (this.dom as HTMLElement) if needed in update() etc.)

    update(node: ProseMirrorNode): boolean { // Add return type
        if (node.type !== this.node.type) return false;

        if (node.attrs.checked !== this.node.attrs.checked) {
            // Use type assertion if calling HTMLElement specific methods
            (this.dom as HTMLElement).setAttribute("data-checked", String(node.attrs.checked));
            this.boxElement!.setAttribute("checked", String(node.attrs.checked));
        }

        this.node = node; // Update internal ProseMirror node
        return true;
    }

     // Ensure handleClick uses the renamed ProseMirrorNode type if necessary
     handleClick(e: MouseEvent): void { // Add return type
        e.preventDefault();

        const pos = this.getPos();
        if (typeof pos !== "number") return;

        const { checked } = this.node.attrs; // this.node is ProseMirrorNode
        const transaction = this.view.state.tr.setNodeAttribute(
            pos,
            "checked",
            !checked
        );

        this.view.dispatch(transaction);
    }
}