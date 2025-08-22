const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const authenticateToken = require('../middlewares/checkLog');
const getUser =require('../middlewares/getUser');
const Quiz = require('../models/Quiz');
const Score = require('../models/Score');

const multer = require('multer');
const path = require('path');

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/uploads/app-images/'); // folder to save images
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
// Make sure your form uses enctype="multipart/form-data"
router.post('/register', upload.single('profilePic'), async (req, res) => {
    const { name, email, password } = req.body;
    const profilePic = req.file ? '/app-images/' + req.file.filename : '/default.jpg';

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

        const newUser = new User({ 
            name, 
            email, 
            password: hashedPassword,
            profilePic,
            rating: 0
        });

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
router.get('/dashboard', authenticateToken, getUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/login');
    }

    // Get all quizzes
    const quizzes = await Quiz.find({ active: true });

    // Get all scores for this user
    const userScores = await Score.find({ user: user._id }).populate('quiz');

    // Map quiz titles and scores for chart
    const userQuizLabels = userScores.map(s => s.quiz.title);
    const userQuizScores = userScores.map(s => s.score);

    // Determine top score
    const userTopScore = userScores.length > 0 ? Math.max(...userQuizScores) : 0;

    res.render('protected/dashboard', {
      title: 'Dashboard',
      user,
      totalQuizzes: quizzes.length,
      userTopScore,
      userQuizLabels,
      userQuizScores
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


router.get('/users', authenticateToken, getUser, isAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }); // Exclude admins
    res.render('protected/admin/users', { title: 'All Users', users, user: req.user });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not fetch users.');
    res.redirect('/admin');
  }
});

// DELETE user
router.post('/users/delete/:id', authenticateToken, getUser, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    req.flash('success', 'User deleted successfully.');
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not delete user.');
    res.redirect('/users');
  }
});

router.get('/leaderboard', authenticateToken, getUser, async (req, res) => {
  try {
    // Aggregate total score per user
    const leaderboard = await Score.aggregate([
      { 
        $group: { 
          _id: "$user", 
          totalScore: { $sum: "$score" }, 
          quizzesTaken: { $sum: 1 } 
        } 
      },
      { $sort: { totalScore: -1 } },
      { $limit: 10 } // top 10 users
    ]);

    // Populate user details (_id now contains user info)
    const results = await User.populate(leaderboard, { path: "_id", select: "name profilePic rating" });

    res.render('leaderboard', { 
      title: 'Leaderboard', 
      leaderboard: results, 
      user: req.user 
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not load leaderboard.');
    res.redirect('/');
  }
});


// GET profile page
router.get('/profile', authenticateToken, getUser, async (req, res) => {
    res.render('profile', { 
        title: 'Update Profile', 
        user: req.user, 
        success: req.flash('success'),
        error: req.flash('error')
    });
});

// POST update profile
router.post('/profile', authenticateToken, getUser, upload.single('profilePic'), async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await User.findById(req.user._id);

        if (name) user.name = name;
        if (email) user.email = email;
        if (password) user.password = password; // Make sure to hash password in User model pre-save hook
        if (req.file) user.profilePic = '/uploads/' + req.file.filename;

        await user.save();
        req.flash('success', 'Profile updated successfully.');
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to update profile.');
        res.redirect('/profile');
    }
});
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    req.flash('success', 'You have logged out.');
    res.redirect('/login');
});
module.exports = router;
