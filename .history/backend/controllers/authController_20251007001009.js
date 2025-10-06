import jwt from 'jsonwebtoken';
import { User } from '../models/User'; // Imports the Mongoose User model

/**
 * @function generateToken
 * @description Creates a JSON Web Token (JWT) for the given user ID.
 * @param {string} id - The MongoDB ObjectId of the user.
 * @returns {string} The signed JWT string.
 */
const generateToken = (id) => {
    // Uses the secret key from the .env file (JWT_SECRET)
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Token is valid for 30 days
    });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
    const { email, password } = req.body;

    // Basic input validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    try {
        // 1. Check if user already exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // 2. Create the new user (password hashing is handled by the pre-save hook in models.js)
        const user = await User.create({
            email,
            password,
        });

        if (user) {
            // 3. Respond with user info and the JWT
            res.status(201).json({
                _id: user._id,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Registration Error:', error.message);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Find user by email, explicitly including the password hash
        const user = await User.findOne({ email }).select('+password');

        // 2. Check if user exists and if password matches
        if (user && (await user.matchPassword(password))) {
            // 3. Respond with user info and the JWT
            res.json({
                _id: user._id,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ message: 'Server error during login' });
    }
};

export {
    registerUser,
    loginUser
};
