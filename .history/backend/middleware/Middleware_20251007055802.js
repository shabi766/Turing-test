import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';


const protect = async (req, res, next) => {
    let token;


    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
       
            token = req.headers.authorization.split(' ')[1];

  
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
   
                res.status(401).json({ message: 'Not authorized, user not found' });
                return;
            }

   
            req.user = user;

            next(); 

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
