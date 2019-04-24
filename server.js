const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
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

// Serve Public Directory
app.use(express.static(__dirname + '/public'));

// ------------------------------------------ ROUTES ------------------------------------------ //

// GET Root Route
app.get('/', (req, res) => {
  res.send('<h1>Auth App</h1>');
});

// GET New User Route
app.get('/signup', (req, res) => {
  res.render('auth/signup');
});

// POST Create User Route
app.post('/signup', (req, res) => {
  const errors = [];

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

  if (errors.length) {
    return res.render('auth/signup', {user: req.body, errors: errors});
  }

  bcrypt.genSalt(10, (err, salt) => {
    if (err) return res.render('auth/signup', {user: req.body, errors: [{message: 'Something went wrong. Please try again'}]});

    bcrypt.hash(req.body.password, salt, (err, hash) => {
      if (err) return res.render('auth/signup', {user: req.body, errors: [{message: 'Something went wrong. Please try again'}]});

      const newUser = {
        name: req.body.name,
        email: req.body.email,
        password: hash,
      }

      db.User.create(newUser, (err, newUser) => {
        if (err) return res.render('auth/signup', { errors: [err]});
        res.redirect('/login');
      });
    });
  });
});

// GET Login Route
app.get('/login', (req, res) => {
  res.render('auth/login');
});

// --------------------------------------- API ROUTEs --------------------------------------- //

app.get('/api/v1/users', (req, res) => {
  db.User.find((err, allUsers) => {
    if (err) res.json(err);
    res.json(allUsers);
  });
});

// --------------------------------------- START SERVER --------------------------------------- //

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
