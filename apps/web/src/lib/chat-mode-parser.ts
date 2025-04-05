type EmitTokensCallback = (tokens: string) => void;

const CHAT_START_TAG = "[CHAT]";
const CHAT_END_TAG = "[/CHAT]";

export class ChatModeIncrementalParser {
  private isInsideChatBlock: boolean = false;
  private potentialTagBuffer: string = "";
  private emitTokens: EmitTokensCallback;
  private isActive: boolean = false;

  constructor(sendTokensCallback: EmitTokensCallback) {
    this.emitTokens = sendTokensCallback;
  }

  public startStreaming() {
    this.reset();
    this.isActive = true;
  }

  public reset(): void {
    this.isInsideChatBlock = false;
    this.potentialTagBuffer = "";
    this.isActive = true;
  }

  public finalize(): void {
    if (this.isInsideChatBlock) {
      if (this.potentialTagBuffer.length > 0) {
        this.emitTokens(this.potentialTagBuffer);
      }
      console.warn(
        "ChatModeParser: Stream ended unexpectedly inside a [CHAT] block without a closing [/CHAT] tag."
      );
    } else if (this.potentialTagBuffer.length > 0) {
      console.warn(
        "ChatModeParser: Stream ended with unprocessed buffer outside a block:",
        this.potentialTagBuffer
      );
    }
    this.isActive = false;
    this.reset();
  }

  public processChunk(tokens: string): void {
    if (!this.isActive) {
      console.warn("ChatModeParser: process called while inactive.");
      return;
    }

    for (let i = 0; i < tokens.length; i++) {
      const char = tokens[i];
      this.potentialTagBuffer += char;

      if (this.isInsideChatBlock) {
        if (this.potentialTagBuffer.endsWith(CHAT_END_TAG)) {
          const textBeforeTag = this.potentialTagBuffer.slice(
            0,
            this.potentialTagBuffer.length - CHAT_END_TAG.length
          );
          if (textBeforeTag.length > 0) {
            this.emitTokens(textBeforeTag);
          }

          this.isInsideChatBlock = false;
          this.potentialTagBuffer = "";
        } else if (this.potentialTagBuffer.length >= CHAT_END_TAG.length) {
          const sendLength =
            this.potentialTagBuffer.length - (CHAT_END_TAG.length - 1);
          if (sendLength > 0) {
            this.emitTokens(this.potentialTagBuffer.substring(0, sendLength));

            this.potentialTagBuffer =
              this.potentialTagBuffer.substring(sendLength);
          }
        }
      } else {
        if (this.potentialTagBuffer.endsWith(CHAT_START_TAG)) {
          this.isInsideChatBlock = true;
          this.potentialTagBuffer = "";
        } else if (this.potentialTagBuffer.length >= CHAT_START_TAG.length) {
          this.potentialTagBuffer = this.potentialTagBuffer.slice(
            -(CHAT_START_TAG.length - 1)
          );
        }
      }
    }
  }

  public stopStreaming() {
    this.reset();
  }
}
