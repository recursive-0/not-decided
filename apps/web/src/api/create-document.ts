import ky from "ky";


interface CreateDocumentProps {
  userId: string;
}

interface CreateDocumentResponse {
  documentId: string;
  message: string;
}

export async function createDocument(props: CreateDocumentProps): Promise<CreateDocumentResponse> {
    const { userId } = props;

    try{
        const response = await ky.post(`${import.meta.env.VITE_API_BASE_URL}/api/documents/create`, {json: {userId}}).json<CreateDocumentResponse>()
        return response;
    } catch (error) {
        console.error("Error creating document: ", error);
        throw error;
    }
}