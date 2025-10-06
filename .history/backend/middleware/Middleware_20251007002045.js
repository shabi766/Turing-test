import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';


const protect = async (req, res, next) => {
    let token;

    // 1. Check if the token exists in the Authorization header (Bearer <token>)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract the token (Token is typically "Bearer <token>")
            token = req.headers.authorization.split(' ')[1];

            // 2. Decode the token using the secret key
            // The secret key is loaded via dotenv in server.js
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Find the user by the ID stored in the token payload
            // We select('-password') to ensure we don't accidentally fetch the hash
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                // If the token is valid but the user no longer exists in DB
                res.status(401).json({ message: 'Not authorized, user not found' });
                return;
            }

            // 4. Attach the user object (containing the ID) to the request for route handlers
            req.user = user;

            next(); // Move to the next middleware or route handler

        } catch (error) {
            console.error('JWT Verification Error:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
            return;
        }
    }

    // If no token is found in the header
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }
};

export { protect };
