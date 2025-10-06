import express from 'express';
import { protect } from './middleware.js'; // Imports the JWT authentication middleware
import {
    createChat,
    getUserChats,
    getChatMessages,
    sendMessage,
} from './chatControllers.js'; // Imports chat controllers

const router = express.Router();

// All routes here are protected and require a valid JWT token (via the `protect` middleware)

// @desc    Get all chats (GET) / Create a new chat (POST)
// @route   /api/chats
router.route('/').post(protect, createChat) .get(protect, getUserChats);

router.route('/:id/messages') .get(protect, getChatMessages);


router.route('/:id/send') .post(protect, sendMessage);


export default router;