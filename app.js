const express = require('express');
const path = require('path');
const route = require('./routes/route');
const morgan = require('morgan');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cookieparser = require('cookie-parser');
const flash = require('connect-flash');
const session = require('express-session');
const dotenv = require('dotenv')
const User = require('./models/User'); // Adjust path as needed
const getUser = require('./middlewares/getUser');
dotenv.config()
const app = express();



// Session only for flash
app.use(session({
  secret: 'just_for_flash_only',
  resave: false,
  saveUninitialized: false,
}));

app.use(flash());
// Flash message variables accessible in views
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  res.locals.errors = req.flash('errors'); // Optional for validation arrays
  next();
});
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(express.static('uploads'));
app.use(morgan('tiny'));
app.use(cookieparser());
app.use('/', route);


app.use(getUser,(req, res, next)=>{
    res.render('404', { title: '404 Not Found' ,navColor: 'text-green-500',user:req.user});
})

app.listen(3000, async () => {
  console.log('🚀 Server running on http://localhost:3000');
  try {
    await mongoose.connect(process.env.dbURL);
    console.log('✅ Connected to MongoDB');

    // Create root admin on app start
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const name = adminEmail.split('@')[0];
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashpassword = await bcrypt.hash(adminPassword, 10);
    const existingAdmin = await User.findOne({ email: adminEmail, role: 'admin' });
    if (!existingAdmin) {
      const newAdmin = new User({
        name,
        email: adminEmail,
        password: hashpassword, // Ensure your User model hashes passwords!
        role: 'admin'
      });
      await newAdmin.save();
      console.log('👑 Root admin created:', adminEmail);
    } else {
      console.log('👑 Root admin already exists:', adminEmail);
    }
  } catch (err) {
    console.error('❌ Error connecting to MongoDB or creating admin:', err);
  }
});