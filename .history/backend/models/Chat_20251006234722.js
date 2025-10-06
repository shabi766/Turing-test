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

const User = mongoose.model('User', UserSchema);
const Chat = mongoose.model('Chat', ChatSchema);
const Message = mongoose.model('Message', MessageSchema);

module.exports = { User, Chat, Message };
