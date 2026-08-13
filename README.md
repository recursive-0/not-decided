# Wrisor

  **An AI-native writing editor built directly on ProseMirror.**

  Wrisor explores what document editing feels like when AI is integrated into
  the editor’s structured document model instead of added as a separate chat
  window.

  Users can write normally, ask questions about their document, transform a
  selection with natural language, or let the AI compose structured edits.
  Proposed changes remain reviewable before becoming part of the document.

  [Live application](https://wrisor-dev.pages.dev/) ·
  [Demo video](https://drive.google.com/file/d/1PMQaFPPw6RAn6PoLIQulcoZ675ByI9km/view?usp=sharing)

  ## What makes Wrisor different

  Wrisor is built against ProseMirror’s core primitives rather than a
  higher-level editor wrapper. Its schema, editor state, transaction handling,
  plugins, decorations, node views, commands, and keyboard behavior are composed
  directly.

  The central engineering challenge was bridging probabilistic LLM output with
  ProseMirror’s deterministic document tree.

  Wrisor solves this by:

  1. Assigning a stable ID to every addressable document node.
  2. Sending a structured document blueprint to the AI.
  3. Receiving streamed insert and delete operations targeting those node IDs.
  4. Incrementally parsing structured AI content into ProseMirror nodes.
  5. Converting AI operations into ProseMirror transactions.
  6. Tracking proposed changes through plugin state and decorations.
  7. Letting the user accept or reject every change.

  ## Features

  - **Composer mode** — edit the document through natural-language instructions.
  - **Chat mode** — ask questions without modifying the document.
  - **Selection transformations** — rewrite an inline selection or multiple
    structured blocks with surrounding document context.
  - **Reviewable AI edits** — inspect additions and deletions before accepting
    them.
  - **Suggestion navigation** — move between proposed changes and automatically
    bring them into view.
  - **Batch review** — accept or reject all pending changes together.
  - **Incremental rendering** — stream AI-generated headings, paragraphs, lists,
    blockquotes, code blocks, marks, and checkboxes into the editor.
  - **Contextual AI prompt** — open from a text selection or by typing `/`.
  - **Rich-text editing** — headings, lists, blockquotes, links, colors,
    highlights, inline code, and custom code blocks.
  - **Transformation safeguards** — preserve the selected range and temporarily
    guard the editor while a transformation is being generated.

  ## AI editing pipeline

  ```mermaid
  flowchart LR
      A[ProseMirror document] --> B[Stable node blueprint]
      B --> C[Cloudflare Worker]
      C --> D[Gemini]
      D --> E[SSE response stream]
      E --> F[Incremental parser]
      F --> G[ProseMirror renderer]
      G --> H[Transactions]
      H --> I[Suggestion plugins]
      I --> J[Accept or reject]
  ```

  The composer protocol separates three kinds of streamed output:

  - User-facing reasoning rendered in the AI panel.
  - Document operations identifying what to insert or delete.
  - Structured content rendered into the ProseMirror document.

  This separation prevents conversational text from leaking into the document
  and gives the renderer enough information to make precise structural edits.

  ## ProseMirror implementation

  The editor includes:

  - An extended schema with stable node identity.
  - Custom marks for underline, strikethrough, inline code, text color,
    highlighting, superscript, subscript, and links.
  - List, checkbox, blockquote, horizontal-rule, and language-aware code-block
    nodes.
  - A custom code-block `NodeView`.
  - Plugins for node identity, persistent selections, transformation guards,
    suggestion highlighting, suggestion navigation, placeholders, and
    text-transformation review.
  - Custom commands and keymaps for formatting and list behavior.
  - Direct `EditorState`, `EditorView`, and transaction lifecycle management.

  ## Technology

  ### Frontend

  - React 19 and TypeScript
  - ProseMirror
  - Vite
  - Zustand
  - TanStack Query and TanStack Router
  - Tailwind CSS and Radix UI

  ### Backend

  - Cloudflare Workers
  - Cloudflare KV and D1
  - Drizzle ORM
  - Server-Sent Events
  - Gemini 2.5 Flash
  - Zod

  ## Repository structure

  ```text
  apps/
  ├── web/
  │   └── src/
  │       ├── custom-nodes/   ProseMirror nodes and node views
  │       ├── features/       Editor, toolbar, chat, and dashboard UI
  │       ├── lib/            Stream parser, renderer, and editor actions
  │       ├── plugins/        ProseMirror plugins and decorations
  │       └── providers/      Editor lifecycle and React integration
  └── worker/
      └── src/
          ├── ai-models/      Model integrations
          ├── prompts/        Chat, composer, and transformation protocols
          └── routes/         Authentication, documents, and AI streaming
  ```

  ## Running locally

  ### Prerequisites

  - Node.js
  - pnpm
  - A Gemini API key
  - A Google OAuth client ID

  Install the dependencies:

  ```bash
  pnpm install
  ```

  Create `apps/web/.env.local`:

  ```env
  VITE_API_BASE_URL=http://localhost:8787
  VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
  ```

  Create `apps/worker/.dev.vars`:

  ```env
  GEMINI_API_KEY=your_gemini_api_key
  ```

  Prepare the local D1 database:

  ```bash
  pnpm worker db:setup
  ```

  Start the frontend and worker:

  ```bash
  pnpm dev
  ```

  The frontend runs at `http://localhost:5173` and the worker at
  `http://localhost:8787`.

  ## Author

  Built by [Lokendra Singh](https://www.lokendrabuilds.com/).
