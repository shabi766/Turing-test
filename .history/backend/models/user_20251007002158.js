import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';


const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/.+\@.+\..+/, 'Please use a valid email address']
    },
    password: {
        type: String,
        required: true,
        select: false // Do not return password by default for security
    }
}, { timestamps: true });

// Pre-save hook to hash the password before saving a new user
UserSchema.pre('save', async function(next) {
    // Only hash the password if it is new or has been modified
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare passwords
UserSchema.methods.matchPassword = async function(enteredPassword) {
    // 'this' refers to the user document retrieved from the DB
    return await bcrypt.compare(enteredPassword, this.password);
};
const User = mongoose.model('User', UserSchema);
export { User };