import express from 'express';
import { protect } from './middleware.js'; // Imports the JWT authentication middleware
import {
    createChat,
    getUserChats,
    getChatMessages,
    sendMessage,
} from '../controllers/chatController.js'; 

const router = express.Router();


router.route('/').post(protect, createChat) .get(protect, getUserChats);

router.route('/:id/messages') .get(protect, getChatMessages);


router.route('/:id/send') .post(protect, sendMessage);


export default router;