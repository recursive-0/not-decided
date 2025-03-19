enum ParserState {
  "OPENING_ANGLE_BRACKET" = "OPENING_ANGLE_BRACKET",
  "CLOSING_ANGLE_BRACKET" = "CLOSING_ANGLE_BRACKET",
  "FORWARD_SLASH" = "FORWARD_SLASH",
  "COLLECTING_JSON_NODE" = "COLLECTING_JSON_NODE",
}

export class ProseMirrorNodeParser {
  private isStreaming: boolean = false;
  private jsonNodeBuffer: string = "";
  private parserState: ParserState = ParserState.OPENING_ANGLE_BRACKET;
  private schema: any;
  private onNodeComplete: (payload: { nodeJSON: any, nodeIndex: number }) => void;
  private nodeIndex: number = 0;
  private previousState: ParserState | null = null; // Track previous state

  constructor(schema: any, onNodeComplete: (payload: { nodeJSON: any, nodeIndex: number }) => void) {
    this.schema = schema;
    this.onNodeComplete = onNodeComplete;
  }

  public processTokens(tokens: string) {
    if (!this.isStreaming) return;

    for (let i = 0; i < tokens.length; i++) {
      const ch = tokens[i];
      this.processToken(ch);
    }
  }

  public processToken(ch: string) {
    const currentState = this.parserState;
    
    switch (this.parserState) {
      case ParserState.OPENING_ANGLE_BRACKET:
        if (ch === '<') {
          this.parserState = ParserState.CLOSING_ANGLE_BRACKET;
          console.log("Found opening angle bracket, moving to CLOSING_ANGLE_BRACKET state");
        }
        break;
        
      case ParserState.CLOSING_ANGLE_BRACKET:
        if (ch === '>') {
          this.parserState = ParserState.COLLECTING_JSON_NODE;
          this.jsonNodeBuffer = ""; 
          console.log("Found closing angle bracket, starting to collect JSON node");
        } else if (ch === '/') {
          this.parserState = ParserState.FORWARD_SLASH;
          console.log("Found forward slash after opening bracket, moving to FORWARD_SLASH state");
        }
        break;
        
      case ParserState.FORWARD_SLASH:
        if (ch === '>') {
          this.parserState = ParserState.OPENING_ANGLE_BRACKET;
          console.log("Completed closing tag, ready for next node");
        } else {
          console.log("In closing tag, waiting for '>'");
        }
        break;
        
      case ParserState.COLLECTING_JSON_NODE:
        if (ch === '<') {
          try {
            const parsedJSON = JSON.parse(this.jsonNodeBuffer);
            
            this.onNodeComplete({
              nodeJSON: parsedJSON,
              nodeIndex: this.nodeIndex++
            });
            
            console.log("Successfully parsed JSON node:", parsedJSON);
            
            this.parserState = ParserState.CLOSING_ANGLE_BRACKET;
            
          } catch (e) {
            this.jsonNodeBuffer += ch;
            console.log("Failed to parse JSON, continuing collection:", e);
            console.log("JSON FAILED: ", this.jsonNodeBuffer)
          }
        } else {
          this.jsonNodeBuffer += ch;
        }
        break;
        
      default:
        console.warn("Unknown parser state:", this.parserState);
        break;
    }
    
    if (this.parserState !== currentState) {
      this.previousState = currentState;
      console.log(`State transition: ${currentState} -> ${this.parserState}`);
    }
  }

  public startStreaming() {
    console.log("Starting ProseMirror node streaming");
    this.isStreaming = true;
    this.reset();
  }

  public stopStreaming() {
    console.log("Stopping ProseMirror node streaming");
    this.isStreaming = false;
    this.finalize();
  }

  public reset() {
    this.jsonNodeBuffer = "";
    this.parserState = ParserState.OPENING_ANGLE_BRACKET;
    this.previousState = null;
    this.nodeIndex = 0;
    console.log("Parser reset");
  }

  public finalize() {
    if (this.jsonNodeBuffer.trim()) {
      try {
        const nodeJSON = JSON.parse(this.jsonNodeBuffer);
        
        this.onNodeComplete({
          nodeJSON,
          nodeIndex: this.nodeIndex++
        });
        
        console.log("Finalized last JSON node:", nodeJSON);
      } catch (e) {
        console.warn("Failed to parse remaining buffer as JSON:", this.jsonNodeBuffer, e);
      }
    }
    
    this.reset();
  }
}