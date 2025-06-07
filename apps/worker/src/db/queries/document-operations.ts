import { DB } from ".."
import { documents } from "../schema"
import { userExists } from "./user-operations"



export async function createDocument(db: DB, userId: string, title: string = 'Untitled Document') {
    // Validate user exists first
    const isValidUser = await userExists(db, userId)
    if (!isValidUser) {
      throw new Error('User not found')
    }
  
    const documentId = crypto.randomUUID()
    const now = new Date()
  
    const newDocument = {
      documentId,
      userId,
      createdAt: now,
      lastModifiedAt: now,
      documentTitle: title,
      documentContent: '<p>Start writing your thoughts here...</p>'
    }
  
    const [createdDoc] = await db.insert(documents).values(newDocument).returning()
    return createdDoc
  }