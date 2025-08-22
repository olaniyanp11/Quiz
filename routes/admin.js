router.get('/admin', authenticateToken, isAdmin, async (req, res) => {
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

  res.render('admin/dashboard', { 
    title: 'Admin Dashboard', totalQuizzes, totalUsers, topScore, quizLabels, quizData, scoreLabels, scoreData 
  });
});
