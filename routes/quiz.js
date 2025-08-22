const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const authenticateToken = require('../middlewares/checkLog');
const getUser = require('../middlewares/getUser');
function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    req.flash('error', 'Access denied.');
    return res.redirect('/dashboard');
  }
  next();
}

// Admin adds a quiz
router.get('/add', authenticateToken,getUser, isAdmin, (req, res) => {
  res.render('quizzes/add', { title: 'Add Quiz',user: req.user });
});

router.post('/add', authenticateToken,getUser, isAdmin, async (req, res) => {
  try {
    const { title, category, questions } = req.body;
    const quiz = new Quiz({ title, category, questions, createdBy: req.user.userId });
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
router.get('/', authenticateToken,getUser, async (req, res) => {
  const quizzes = await Quiz.find({ active: true });
  res.render('quizzes/index', { title: 'Quizzes', quizzes, user: req.user });
});

module.exports = router;
