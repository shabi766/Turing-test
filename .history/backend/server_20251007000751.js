import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

// Local file imports (using ES Modules)
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
// REMOVE: import { notFound, errorHandler } from './middleware.js'; // Basic error handling middleware
import { protect } from './middleware.js'; // KEEP other middleware imports if necessary


dotenv.config();


connectDB();

const app = express();



const allowedOrigins = ['http://localhost:8000', 'http://127.0.0.1:8000']; 
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Body parser middleware to handle raw JSON
app.use(express.json());

// Simple welcome route for testing
app.get('/', (req, res) => {
    res.send('Chat App API is running...');
});

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);

// Error Handling Middleware (must be LAST)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));

/**
 * Custom Error Handling Functions (Now defined locally in server.js)
 */
function notFound(req, res, next) {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
}

function errorHandler(err, req, res, next) {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
}