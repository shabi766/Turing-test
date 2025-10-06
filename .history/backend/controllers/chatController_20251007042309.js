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



export const streamMessage = async (req, res) => {
  const { content } = req.body;
  const chatId = req.params.id;
  const userId = req.user._id;

  if (!content) {
    return res.status(400).json({ message: 'Message content is required' });
  }

  try {
    // Check chat ownership
    const chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    // Save user's message
    const userMessage = await Message.create({
      chatId,
      userId,
      role: 'user',
      content,
    });

    // Update chat title if it's new
    if (chat.title === 'New Chat') {
      const newTitle = content.substring(0, 30) + (content.length > 30 ? '...' : '');
      chat.title = newTitle;
      await chat.save();
    }

    // Prepare headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Flush initial headers
    res.flushHeaders?.();

    console.log(`[STREAM] Starting LLM stream for chat ${chatId}`);

    // Simulate streaming via LlmService
    const stream = LlmService.getSimulatedStream(content);

    let aiFullResponse = '';

    for await (const chunk of stream) {
      aiFullResponse += chunk;
      // Send chunk progressively
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }

    // Save AI response when stream ends
    await Message.create({
      chatId,
      userId,
      role: 'ai',
      content: aiFullResponse,
    });

    await Chat.updateOne({ _id: chatId }, { $set: { updatedAt: new Date() } });

    // Signal end of stream
    res.write(`data: [DONE]\n\n`);
    res.end();

    console.log(`[STREAM] Completed LLM stream for chat ${chatId}`);

  } catch (error) {
    console.error('Stream Message Error:', error.message);
    res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
    res.end();
  }
};
// Edit Message
export const editMessage = async (req, res) => {
  const { id } = req.params; // message ID
  const { content } = req.body;
  const userId = req.user._id;

  try {
    const message = await Message.findById(id);

    if (!message) return res.status(404).json({ message: "Message not found" });
    if (message.role !== "user" || message.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this message" });
    }

    message.content = content;
    await message.save();

    res.status(200).json(message);
  } catch (error) {
    console.error("Edit Message Error:", error.message);
    res.status(500).json({ message: "Server error editing message" });
  }
};

// Delete Message
export const deleteMessage = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (message.role !== "user" || message.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    await message.deleteOne();
    res.status(200).json({ message: "Message deleted" });
  } catch (error) {
    console.error("Delete Message Error:", error.message);
    res.status(500).json({ message: "Server error deleting message" });
  }
};


export {
    createChat,
    getUserChats,
    getChatMessages,
    sendMessage,
    streamMessage,
    editMessage,
    deleteMessage,
};
