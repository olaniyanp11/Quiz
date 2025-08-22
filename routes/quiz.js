const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const authenticateToken = require('../middlewares/checkLog');
const getUser = require('../middlewares/getUser');
const multer = require('multer');
const path = require('path');
const Score = require('../models/Score');
const User = require('../models/User');

// Configure Multer for cover upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/quiz-covers'); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    req.flash('error', 'Access denied.');
    return res.redirect('/dashboard');
  }
  next();
}

// Admin adds a quiz
router.get('/add', authenticateToken, getUser, isAdmin, (req, res) => {
  res.render('quizzes/add', { title: 'Add Quiz', user: req.user });
});
router.post('/add', authenticateToken, getUser, isAdmin, upload.single('cover'), async (req, res) => {
  try {
    const { title, category, questions } = req.body;
    const cover = req.file ? '/uploads/quiz-covers/' + req.file.filename : undefined;

    const quiz = new Quiz({ 
      title, 
      category, 
      questions: Object.values(questions), // convert question objects to array
      cover,
      createdBy: req.user._id 
    });

    await quiz.save();
    req.flash('success', 'Quiz added successfully.');
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Could not add quiz.');
    res.redirect('/quizzes/add');
  }
});

// List quizzes (for users)
router.get('/', authenticateToken, getUser, async (req, res) => {
  const quizzes = await Quiz.find({ active: true });
  res.render('quizzes/index', { title: 'Quizzes', quizzes, user: req.user });
});
// GET /quizzes/take/:id
router.get('/take/:id', authenticateToken, getUser, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || !quiz.active) {
      req.flash('error', 'Quiz not found or inactive.');
      return res.redirect('/quizzes');
    }

    // Set a timer (in minutes)
    const timeLimit = quiz.timeLimit || 10; // default 10 minutes if not set
    res.render('quizzes/take', { title: quiz.title, quiz, timeLimit, user: req.user });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong.');
    res.redirect('/quizzes');
  }
});

// POST /quizzes/take/:id
router.post('/take/:id', authenticateToken, getUser, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    const user = req.user
    if (!quiz) {
      req.flash('error', 'Quiz not found.');
      return res.redirect('/quizzes');
    }

    const answers = req.body; // object with keys as question indexes

    let score = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.answer) score += 1;
    });

    // Save score
    const newScore = new Score({
      user:user._id,
      quiz: quiz._id,
      score,
      total: quiz.questions.length
    });
    await newScore.save();

    // --- Update User Rating ---
    const allScores = await Score.find({ user: user._id });
    const totalScore = allScores.reduce((acc, s) => acc + s.score, 0);
    const totalQuestions = allScores.reduce((acc, s) => acc + s.total, 0);

    const newRating = totalQuestions > 0 ? (totalScore / totalQuestions) * 5 : 0;

    await User.findByIdAndUpdate(user._id, { rating: newRating });

    req.flash('success', `Quiz submitted successfully! You scored ${score}/${quiz.questions.length}`);
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error submitting quiz.');
    res.redirect('/quizzes');
  }
});


module.exports = router;
