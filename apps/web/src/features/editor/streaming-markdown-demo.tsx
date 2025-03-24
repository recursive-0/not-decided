import React, { useRef, useEffect } from 'react';
import * as smd from 'streaming-markdown';

const StreamingMarkdownDemo = () => {
  const containerRef = useRef(null);
  const parserRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      // Initialize the streaming markdown parser
      const renderer = smd.default_renderer(containerRef.current);
      parserRef.current = smd.parser(renderer);

      // Simulate streaming tokens from an LLM
      simulateStreamingTokens();
    }

    return () => {
      // Clean up when component unmounts
      if (parserRef.current) {
        smd.parser_end(parserRef.current);
      }
    };
  }, []);

  const simulateStreamingTokens = () => {
    // Example markdown content broken into chunks as if streamed from an LLM
    const markdownChunks = [
        "# The Future of Quan",
        "tum Compu",
        "ting: Promises and Chall",
        "enges\n\n",
        "Quantum computing repres",
        "ents a funda",
        "mental shift in how we pro",
        "cess infor",
        "mation, lever",
        "aging the strange pro",
        "perties of *quantum mech",
        "anics* such as super",
        "position and entang",
        "lement.\n\n",
        "## Key Advan",
        "tages Over Class",
        "ical Computing\n\n",
        "1. **Expo",
        "nential para",
        "llelism** - qua",
        "ntum bits can repre",
        "sent multi",
        "ple states simul",
        "taneously\n",
        "2. **Quan",
        "tum tunn",
        "eling** - the abil",
        "ity to solve optim",
        "ization probl",
        "ems by pass",
        "ing energy barri",
        "ers\n",
        "3. **Entan",
        "glement-base",
        "d algo",
        "rithms** - allow",
        "ing for novel compu",
        "tational appro",
        "aches\n\n",
        "```pytho",
        "n\n# Example of a simp",
        "lified quantum circuit\nimport ",
        "qiskit\n\ndef create_bell_",
        "state():\n    # Init",
        "ialize circuit with two qu",
        "bits\n    circuit = qiskit.Quan",
        "tumCircuit(2, 2)",
        "\n    # Put qubit 0 into super",
        "position\n    circuit.h(0)",
        "\n    # Entangle qu",
        "bits 0 and 1\n    circuit.cx(0, 1)",
        "\n    return cir",
        "cuit\n```\n\n",
        "> \"I think I can safely ",
        "say that no",
        "body under",
        "stands quantum ",
        "mechanics.\" - Richard Fe",
        "ynman\n\n",
        "## Current Limi",
        "tations\n\n",
        "Despite significant prog",
        "ress, several challenge",
        "s remain:\n\n",
        "- **Deco",
        "herence** - quantum states are ext",
        "remely frag",
        "ile and diffic",
        "ult to main",
        "tain\n",
        "- **Scala",
        "bility** ~~issues~~ - adding more qu",
        "bits incr",
        "eases error rates expo",
        "nentially\n",
        "- **Error corre",
        "ction** - requires sig",
        "nificant over",
        "head\n\n",
        "| Quantum Archit",
        "ecture | Qub",
        "its | Cohe",
        "rence Time | Comp",
        "any |\n|--",
        "----------|--",
        "---|---",
        "-----------|---",
        "------|\n| Supercon",
        "ducting | 100+ | ~100μs | IBM, Go",
        "ogle |\n| Trapped Ion | 20",
        "+ | ~sec",
        "onds | IonQ, Hon",
        "eywell |\n| Photonic | Var",
        "iable | ~ns | PsiQu",
        "antum |\n\n",
        "The path toward [quantum adva",
        "ntage](https://en.wiki",
        "pedia.org/wiki/Quantum_sup",
        "remacy) in pract",
        "ical applications remai",
        "ns uncert",
        "ain but promising."
      ];

    // Function to stream tokens with realistic timing
    const streamToken = (index) => {
      if (index >= markdownChunks.length) return;

      // Write the current chunk to the parser
      smd.parser_write(parserRef.current, markdownChunks[index]);

      // Schedule the next chunk with variable timing to simulate realistic streaming
      const delay = Math.floor(Math.random() * 150) + 50; // 50-200ms delay
      setTimeout(() => streamToken(index + 1), delay);
    };

    // Start streaming
    streamToken(0);
  };

  return (
    <div className="streaming-markdown-demo">
      <h2>Streaming Markdown Demo</h2>
      <div 
        ref={containerRef} 
        className="markdown-container"
        style={{
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '16px',
          minHeight: '300px',
          backgroundColor: '#f9f9f9'
        }}
      ></div>
    </div>
  );
};

export default StreamingMarkdownDemo;