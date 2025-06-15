
export type Role = "user" | "echo"

export interface Message {
    id: string
    role: "echo" | "user",
    content: string,
}

export type ChatMode = "CHAT" | "COMPOSER"

