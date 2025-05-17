
// this function should return the latest charater that user typed

const validWordRag = (/^[A-Za-z]+$/)

export function getAllWords(textContent: string){

    const allWords = textContent.split(" ")
    console.log("Words are: ", allWords)

    const validWords: string[] = []

    for(let i = 0; i < allWords.length; i++){
        const word = allWords[i]

        if(validWordRag.test(word)){
            validWords.push(word)
        }
    }
    return validWords

}


interface ValidContentNodes {
    id: string,
    content: {
        type: string,
        content: string
    }
}

export const getContentNodes = (editorView) => {
    const editorDoc = editorView.state.doc;
    const validContentNodes: ValidContentNodes[] = [];
    const processedTextContent = new Set(); // To track duplicate content
    
    // First pass: Collect all nodes with IDs
    editorDoc.descendants((node) => {
      const nodeId = node.attrs.nodeId;
      
      if (nodeId) {
        const isContainer = ['bullet_list', 'ordered_list'].includes(node.type.name);
        const textContent = node.textContent;
        
        const isParaInListItem = 
          node.type.name === 'paragraph' && 
          node.parent && 
          node.parent.type.name === 'list_item';
          
        if (!isParaInListItem && (isContainer || !processedTextContent.has(textContent))) {
          const contentNode = {
            type: node.type.name,
            content: textContent,
          };
          validContentNodes.push({ id: nodeId, content: contentNode });
          
          // Track this content to avoid duplicates
          if (!isContainer) {
            processedTextContent.add(textContent);
          }
        }
      }
    });
  
    return validContentNodes;
  };