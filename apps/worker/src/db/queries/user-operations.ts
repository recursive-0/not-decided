import { eq } from 'drizzle-orm'
import { GoogleUserType } from '../../routes/google-login'
import { DB } from '..'
import { users } from '../schema'

export async function upsertUser(db: DB, userDetails: GoogleUserType) {
  try {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, userDetails.email))
      .get()

    if (existingUser) {
      const updatedUser = await db
        .update(users)
        .set({
          name: userDetails.name,
          picture: userDetails.picture,
        })
        .where(eq(users.email, userDetails.email))
        .returning()
      
      return updatedUser[0]
    }

    const newUser = {
      userId: crypto.randomUUID(),
      email: userDetails.email,
      name: userDetails.name,
      picture: userDetails.picture,
      createdAt: new Date(),
    }

    const [createdUser] = await db.insert(users).values(newUser).returning()
    return createdUser

  } catch (error) {
    console.error('Database operation failed:', error)
    throw new Error('Failed to upsert user')
  }
}


export async function getUserById(db: DB, userId: string) {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.userId, userId))
      .get()
    
    return user || null
  } catch (error) {
    console.error('Failed to get user by ID:', error)
    throw new Error('Database error while fetching user')
  }
}

export async function userExists(db: DB, userId: string): Promise<boolean> {
  try {
    const user = await getUserById(db, userId)
    return user !== null
  } catch (error) {
    return false
  }
}