const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const authenticateToken = require('../middlewares/checkLog');
const getUser =require('../middlewares/getUser');
const Quiz = require('../models/Quiz');
const Score = require('../models/Score');

function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    req.flash('error', 'Access denied.');
    return res.redirect('/dashboard');
  }
  next();
}

// Pages
router.get('/', getUser, (req, res) => {
    res.render('index', { title: 'Home', navColor: 'text-white', user: req.user });
});

router.get('/register', getUser, (req, res) => {
    res.render('register', { title: 'Register', user: req.user });
});

router.get('/login', getUser, (req, res) => {
    res.render('login', { title: 'Login', user: req.user });
});

// POST /register
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'Email already exists.');
            return res.redirect('/register');
        }

        if (password.length < 6) {
            req.flash('error', 'Password must be at least 6 characters long.');
            return res.redirect('/register');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        req.flash('success', 'Account created successfully. Please login.');
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while registering.');
        res.redirect('/register');
    }
});

// POST /login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }

        const token = jsonwebtoken.sign({ userId: user._id }, 'your_jwt_secret', { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });

        req.flash('success', 'Welcome back!');
        if (user.role === 'admin') {
            return res.redirect('/admin');
        }
        return res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        req.flash('error', 'An error occurred while logging in.');
        res.redirect('/login');
    }
});

// GET /dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/login');
        }

        res.render('protected/dashboard', {
            title: 'Dashboard',
            user, user: req.user
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Something went wrong.');
        res.redirect('/login');
    }
});
router.get('/admin', authenticateToken,getUser, isAdmin, async (req, res) => {
  const totalQuizzes = await Quiz.countDocuments();
  const totalUsers = await User.countDocuments({ role: 'user' });
  const topScoreDoc = await Score.findOne().sort({ score: -1 }).populate('user quiz');
  const topScore = topScoreDoc ? topScoreDoc.score : 0;

  // Example chart data
  const quizzes = await Quiz.find();
  const quizLabels = quizzes.map(q => q.title);
  const quizData = quizzes.map(q => Math.floor(Math.random() * 50) + 1); // Replace with actual participant counts

  const scoreLabels = ['0-20','21-40','41-60','61-80','81-100'];
  const scoreData = [5,10,20,15,7]; // Example, compute from Score collection

  res.render('protected/admin/dashboard', { 
    title: 'Admin Dashboard', totalQuizzes, totalUsers, topScore, quizLabels, quizData, scoreLabels, scoreData , user: req.user
  });
});

// GET /logout
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    req.flash('success', 'You have logged out.');
    res.redirect('/login');
});

module.exports = router;
