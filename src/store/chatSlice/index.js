import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from 'uuid';
import { marked } from "marked";
import DOMPurify from 'dompurify';

// Simple initial state - redux-persist will handle loading from localStorage
const initialState = {
    data: [],
};

/*
data:[
    {
        id: 1,
        title: 'qweqweqw,
        messages: [
            {id: 1, text: 'react là gì', isBot: false},
            {id: 2, text: 'react là lib của js', isBot: true},
        ]
        
    }
]
*/

const ChatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers:{
        addChat: (state, action) => {
            state.data.push({
                id: action.payload,
                title: 'Chat',
                messages: []
            })
        },
        addMessage: (state, action) =>{
            const {idChat, userMess, botMess} = action.payload;
            const chat = state.data.find((chat) => chat.id === idChat);
            if(chat){
                const messageFormat = marked.parse(botMess);
                const safeChat = DOMPurify.sanitize(messageFormat)
                const newMessage = [
                    ...chat.messages,
                    {id: uuidv4(), text: userMess, isBot: false },
                    {id: uuidv4(), text: safeChat, isBot: true },
                ]

                chat.messages = newMessage;
            }
            
        },
        removeChat: (state, action) =>{
            state.data = state.data.filter((chat) => chat.id !== action.payload);
        },
        setNameChat: (state, action) =>{
            const {newTitle, chatId} = action.payload;
            const chat = state.data.find((chat) => chat.id === chatId)
            if(chat){
                chat.title = typeof newTitle === 'string' ? newTitle : 'Chat';
            }
        },
        addUserMessage: (state, action) => {
            const {idChat, userMess} = action.payload;
            const chat = state.data.find((chat) => chat.id === idChat);
            if(chat){
                chat.messages.push({
                    id: uuidv4(),
                    text: userMess,
                    isBot: false
                });
            }
        },
        addBotMessage: (state, action) => {
            const {idChat, botMess} = action.payload;
            const chat = state.data.find((chat) => chat.id === idChat);
            if(chat){
                const messageFormat = marked.parse(botMess);
                const safeChat = DOMPurify.sanitize(messageFormat);
                chat.messages.push({
                    id: uuidv4(),
                    text: safeChat,
                    isBot: true
                });
            }
        },
    }
})

export const { addChat, removeChat, addMessage, setNameChat, addUserMessage, addBotMessage } = ChatSlice.actions;

export default ChatSlice.reducer;