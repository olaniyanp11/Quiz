const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, "Email is invalid"]
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6
  },
  profilePic: {
    type: String,
    default: '/images/default-avatar.png' // default avatar
  },
  rating: {
    type: Number,
    default: 0, // can be total score or average rating
    min: 0,
    max: 5
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
