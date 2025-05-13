interface TrieNode {
  char: string;
  children: TrieNode[];
  isEndOfWord: boolean;
}

function alphabetsMap(): Map<string, TrieNode> {
  const map = new Map<string, TrieNode>();
  for (let i = 97; i <= 122; i++) {
    const char = String.fromCharCode(i);
    if (char) {
      map.set(char, {
        char: char,
        children: [],
        isEndOfWord: false, // Corrected typo: isEndOfword -> isEndOfWord
      });
    }
  }
  return map;
}

export class AutocompletePrefixTree {
  public alphabetsMap: Map<string, TrieNode>;
  public suggestions: string[] = [];

  constructor() {
    this.alphabetsMap = alphabetsMap();
  }

  public dfs(node: TrieNode, currentWord: string) {
    if (node.isEndOfWord) {
      this.suggestions.push(currentWord);
    }

    for (let i = 0; i < node.children.length; i++) {
      const childNode = node.children[i];
      this.dfs(childNode, currentWord + childNode.char);
    }
  }

  public getSuggestionsForWord(prefix: string): string[] {
    if (!prefix) return [];
    let currentNode: TrieNode | undefined = this.alphabetsMap.get(prefix[0]);
    if (!currentNode) return [];

    for (let i = 1; i < prefix.length; i++) {
      const charToFind = prefix[i];
      let foundNextChar = false;
      const children = currentNode!.children;
      for (let j = 0; j < children.length; j++) {
        const child = children[j];
        if (charToFind === child.char) {
          currentNode = child;
          foundNextChar = true;
          break;
        }
      }
      if (!foundNextChar) return [];
    }

    this.suggestions = [];
    if (currentNode!.isEndOfWord) {
      this.suggestions.push(prefix);
    }
    for (const childNode of currentNode!.children) {
      this.dfs(childNode, prefix + childNode.char);
    }
    return this.suggestions;
  }

  public insertCharacters(word: string) {
    if (!word) return;
    let currentNode: TrieNode | undefined = this.alphabetsMap.get(word[0]);

    if (!currentNode) {
      return;
    }

    for (let i = 1; i < word.length; i++) {
      const char = word[i];
      let childNode: TrieNode | undefined = undefined;
      const children = currentNode.children;

      for (let j = 0; j < children.length; j++) {
        if (children[j].char === char) {
          childNode = children[j];
          break;
        }
      }

      if (!childNode) {
        const newNode: TrieNode = {
          char: char,
          children: [],
          isEndOfWord: false,
        };
        children.push(newNode);
        childNode = newNode;
      }
      currentNode = childNode;
    }
    currentNode.isEndOfWord = true;
  }
}
