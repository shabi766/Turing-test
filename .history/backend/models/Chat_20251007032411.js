import mongoose from "mongoose";
const ChatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        // The frontend can update this later based on the first message
        default: 'New Chat' 
    },
    // We don't embed messages here; we link them via the chatId in MessageSchema
}, { timestamps: true });
// Define and export the Chat model only. Other models are defined in their own files.
const Chat = mongoose.model('Chat', ChatSchema);

export { Chat };
