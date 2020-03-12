if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

//Imports
const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const initailizePassport = require('./passport-config');

//Passport
initailizePassport(
	passport,
	email => {
		return users.find(user => user.email === email);
	},
	id => users.find(user => user.id === id)
);

//Local database
const users = [];

//Express setup
const app = express();

app.set('view-engine', 'ejs');

//Allows request variable to access form variables
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
	})
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

//Routing
app.get('/', checkAuthenticated, (req, res) => {
	res.render('index.ejs', { name: req.user.name });
});

app.get('/login', checkNotAuthenticated, (req, res) => {
	res.render('login.ejs');
});

app.get('/register', checkNotAuthenticated, (req, res) => {
	res.render('register.ejs');
});

//Post methods
app.post(
	'/login',
	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/login',
		failureFlash: true,
	})
);
app.post('/register', async (req, res) => {
	try {
		const hashedPassword = await bcrypt.hash(req.body.password, 10);
		users.push({
			id: Date.now().toString(),
			name: req.body.name,
			email: req.body.email,
			password: hashedPassword,
		});
		res.redirect('/login');
	} catch {
		res.redirect('/register');
	}
});

app.delete('/logout', (req, res) => {
	req.logOut();
	res.redirect('/login');
});

//Protect routes
function checkAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}

	res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return res.redirect('/');
	}

	next();
}

//Port
app.listen(3000);
