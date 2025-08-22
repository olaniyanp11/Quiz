const express = require('express');
const authRoutes = require('./auth');
const quizRoute = require('./quiz');
const getUser = require('../middlewares/getUser');
const router = express.Router();



router.use("/",authRoutes)
router.use("/user",authRoutes)
router.use("/quizzes", quizRoute);


module.exports = router;