const express = require('express');
const bodyParser = require('body-parser');
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
  db.User.create(req.body, (err, newUser) => {
    if (err) return res.render('auth/signup', { errors: [err]});
    res.redirect('/login');
  });
});

// GET Login Route
app.get('/login', (req, res) => {
  res.render('auth/login');
});

// --------------------------------------- START SERVER --------------------------------------- //

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
