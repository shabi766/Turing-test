import { Chat } from '../models/Chat.js'; 
import { Message } from '../models/Message.js';
import LlmService from '../Services/LlmService.js'; 


const createChat = async (req, res) => {
    try {
        const newChat = await Chat.create({
            userId: req.user._id, 
            title: 'New Chat', 
        });

        res.status(201).json(newChat);
    } catch (error) {
        console.error('Create Chat Error:', error.message);
        res.status(500).json({ message: 'Server error creating chat' });
    }
};

/**
 * @desc    Get all chats for the logged-in user
 * @route   GET /api/chats
 * @access  Private
 */
const getUserChats = async (req, res) => {
    try {
        // Find chats owned by the authenticated user, sorted by last updated time (newest first)
        const chats = await Chat.find({ userId: req.user._id })
            .sort({ updatedAt: -1 })
            .lean(); // Use lean() for faster read operations

        res.status(200).json(chats);
    } catch (error) {
        console.error('Get User Chats Error:', error.message);
        res.status(500).json({ message: 'Server error fetching chats' });
    }
};

/**
 * @desc    Get all messages for a specific chat
 * @route   GET /api/chats/:id/messages
 * @access  Private
 */
const getChatMessages = async (req, res) => {
    try {
        const chatId = req.params.id;

        // 1. Verify chat exists and belongs to the user (security check)
        const chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found or access denied' });
        }

        // 2. Fetch all messages for the validated chat
        const messages = await Message.find({ chatId: chatId })
            .sort({ createdAt: 1 }) // Order chronologically
            .lean();

        res.status(200).json(messages);
    } catch (error) {
        console.error('Get Messages Error:', error.message);
        res.status(500).json({ message: 'Server error fetching messages' });
    }
};


/**
 * @desc    
 * @route   
 * @access  
 */
const sendMessage = async (req, res) => {
    const { content } = req.body;
    const chatId = req.params.id;
    const userId = req.user._id;

    if (!content) {
        return res.status(400).json({ message: 'Message content is required' });
    }

    try {
        // 1. Verify chat exists and belongs to the user
        const chat = await Chat.findOne({ _id: chatId, userId: userId });
        if (!chat) {
            return res.status(404).json({ message: 'Chat not found or access denied' });
        }

        // 2. Save the User's Message immediately
        const userMessage = await Message.create({
            chatId: chatId,
            userId: userId,
            role: 'user', // 'user' role
            content: content,
        });

        if (chat.title === 'New Chat') {
            const newTitle = content.substring(0, 30) + (content.length > 30 ? '...' : '');
            chat.title = newTitle;
            await chat.save();
        }

     
        res.status(202).json({
            userMessage: userMessage,
            message: 'User message saved. AI response processing started asynchronously.',
        });


       
        console.log(`[Background Task] Starting LLM simulation for Chat ID: ${chatId}`);

        const aiResponse = await LlmService.getSimulatedResponse(content);

        // 6. Save the AI's response message
        await Message.create({
            chatId: chatId,
            userId: userId,
            role: 'ai', // 'ai' role
            content: aiResponse.content,
        });

        // 7. Update chat's updatedAt field to bring it to the top of the sidebar
        await Chat.updateOne({ _id: chatId }, { $set: { updatedAt: new Date() } });

        console.log(`[Background Task] LLM response saved for Chat ID: ${chatId}`);

    } catch (error) {
        console.error('Send Message Error (Async Block):', error.message);
    }
};


export {
    createChat,
    getUserChats,
    getChatMessages,
    sendMessage,
};
