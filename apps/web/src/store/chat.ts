
import { CurrentActionType } from "@/lib/composer-mode-parser"
import type { ChatMode, Message } from "@/types/messages"
import { create } from "zustand"

export interface ChatStoreProps {
    currentChatMode: ChatMode
    setCurrentChatMode: (mode: ChatMode) => void,
    chatMessages: Message[],
    setChatMessages: (messages: Message[]) => void
    addChatMessage: (message: Message) => void
    appendTokenToLastMessage: (token: string) => void
    currentLLMAction: CurrentActionType
    setCurrentLLMAction: (action: CurrentActionType) => void
}

export const useChatStore = create<ChatStoreProps>((set) => ({
    currentChatMode: "COMPOSER",
    chatMessages: [],
    currentLLMAction: CurrentActionType.NORMAL,
    setCurrentLLMAction(action) {
        return set(() => ({currentLLMAction: action}))
    },
    setCurrentChatMode: (mode) => set(() => ({currentChatMode: mode})),
    addChatMessage: (newMessage) => set((state) => ({
        chatMessages: [...state.chatMessages, newMessage]
    })),
    setChatMessages: (messages) => set(() => ({
        chatMessages: messages
    })),
    appendTokenToLastMessage: (token) => set((state) => {
        
        if (state.chatMessages.length === 0) {
            return state; 
        }
        
        return {
            chatMessages: state.chatMessages.map((message, index) => {
                
                if (index === state.chatMessages.length - 1) {
                    
                    return { ...message, content: message.content + token };
                }
                return message; 
            })
        };
    }),
}))