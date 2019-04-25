const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const app = express();
const PORT = process.env.PORT || 4000;

// View Engine
app.set('view engine', 'ejs');

// Database
const db = require('./models');

// ---------------------------------------- MIDDLEWARE ---------------------------------------- //

// Parse URL Encoded Form Data
app.use(bodyParser.urlencoded({extended: true}));
// Parse JSON Data
app.use(bodyParser.json());

// Express Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'SSShhhhhh, this is a secret...',
  resave: false,
  saveUninitialized: false
}));

// Serve Public Directory
app.use(express.static(__dirname + '/public'));

// ------------------------------------------ ROUTES ------------------------------------------ //

// GET Root Route
app.get('/', (req, res) => {
  // Only allow logged-in users to view this route
  if (!req.session.loggedIn) {
    return res.redirect('/login');
  }
  res.render('dashboard', {currentUser: req.session.currentUser});
});

// GET Profile Route
app.get('/profile', (req, res) => {
  // Only allow logged-in users to view this route
  if (!req.session.loggedIn) {
    return res.redirect('/login');
  }
  res.render('profile', {currentUser: req.session.currentUser});
});

// GET New User Route
app.get('/signup', (req, res) => {
  res.render('auth/signup');
});

// POST Create User Route
app.post('/signup', (req, res) => {
  const errors = [];

  // Validate Form Data
  if (!req.body.name) {
    errors.push({message: 'Please enter your name'});
  }

  if (!req.body.email) {
    errors.push({message: 'Please enter your email'});
  }

  if (!req.body.password) {
    errors.push({message: 'Please enter your password'});
  }

  if (req.body.password !== req.body.password2) {
    errors.push({message: 'Your passwords do not match'});
  }

  // If there are any validation errors, Re-render signup page with error messages
  if (errors.length) {
    return res.render('auth/signup', {user: req.body, errors: errors});
  }

  // Generate salt for additional password hash complexity
  bcrypt.genSalt(10, (err, salt) => {
    if (err) return res.render('auth/signup', {user: req.body, errors: [{message: 'Something went wrong. Please try again'}]});

    // Hash user password from signup form
    bcrypt.hash(req.body.password, salt, (err, hash) => {
      if (err) return res.render('auth/signup', {user: req.body, errors: [{message: 'Something went wrong. Please try again'}]});

      // Create an object to hold the new user information (with hashed password, not original password)
      const newUser = {
        name: req.body.name,
        email: req.body.email,
        password: hash,
      }

      // Create a new User record in MongoDB from the newUser object above
      db.User.create(newUser, (err, newUser) => {
        if (err) return res.render('auth/signup', { errors: [err]});
        // If new user was created successfully, redirect user to login page
        // We could also create the session here (just like the login route), then redirect to the dashboard instead
        res.redirect('/login');
      });
    });
  });
});

// GET Login Route
app.get('/login', (req, res) => {
  res.render('auth/login');
});

// POST Login Route
app.post('/login', (req, res) => {
  // First make sure the user didn't submit an empty form
  if (!req.body.email || !req.body.password) {
    return res.render('auth/login', {user: req.body, errors: [{message: 'Please enter your email and password'}]});
  }

  // Find one User by email
  db.User.findOne({email: req.body.email}, (err, foundUser) => {
    if (err) return res.render('auth/login', {user: req.body, errors: [{message: 'Something went wrong. Please try again'}]});

    // If we didn't find a user, re-render the login page with error message
    if (!foundUser) {
      return res.render('auth/login', {user: req.body, errors: [{message: 'Username or password is incorrect'}]});
    }

    // If this line of code runs, it means we found the user
    // Compare the password submitted by user login form with password from found user
    bcrypt.compare(req.body.password, foundUser.password, (err, isMatch) => {
      if (err) return res.render('auth/login', {user: req.body, errors: [{message: 'Something went wrong. Please try again'}]});

      // If the passwords match, create a new session with loggedIn and currentUser properties (or any properties you want except the user password)
      if (isMatch) {
        req.session.loggedIn = true;
        req.session.currentUser = {
          name: foundUser.name,
          email: foundUser.email,
        }
        // Redirect user to the dashboard
        return res.redirect('/');
      } else {
        // If the passwords do not match, re-render the login page with error message
        return res.render('auth/login', {user: req.body, errors: [{message: 'Username or password is incorrect'}]});
      }
    });
  });
});

// GET Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.render('auth/login', {user: req.body, errors: [{message: 'Something went wrong. Please try again'}]});
    res.redirect('/login');
  })
});

// --------------------------------------- API ROUTEs --------------------------------------- //

// Helper route just for development so I can easily see the users in the database
app.get('/api/v1/users', (req, res) => {
  db.User.find((err, allUsers) => {
    if (err) res.json(err);
    res.json(allUsers);
  });
});

// --------------------------------------- START SERVER --------------------------------------- //

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
