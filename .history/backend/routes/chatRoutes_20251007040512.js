import express from 'express';
import { protect } from '../middleware/Middleware.js'; // Imports the JWT authentication middleware
import {
    createChat,
    getUserChats,
    getChatMessages,
    sendMessage,
    streamMessage,
} from '../controllers/chatController.js'; 

const router = express.Router();


router.route('/').post(protect, createChat) .get(protect, getUserChats);

router.route('/:id/messages') .get(protect, getChatMessages);


router.route('/:id/send') .post(protect, sendMessage);

router.post('/:id/stream', protect, streamMessage);


export default router;