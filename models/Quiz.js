const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }], // multiple choice
  answer: { type: String, required: true }     // correct option
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  cover: { type: String, default: '/images/default-quiz.jpg' }, // Cover image URL
  questions: [questionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);
module.exports = Quiz;
