'use strict';

var express = require('express');
var app = express();
var pg = require('pg');
var http = require('http').Server(app);
var https = require('https');
var env = require('node-env-file');
var session = require('express-session');
var bodyParser = require('body-parser');
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var cloudy = require('cloudinary');

try {
	env(__dirname + '/.env');
} catch(err) {
	console.log('[Looks like heroku]');
}

var exotel = require('exotel')({
    id   : process.env.EXOTEL_ID, 
    token: process.env.EXOTEL_TOCKEN 
});

var passportOptions = {
	host: 'www.google.com',
	path: '/m8/feeds/contacts/default/full?alt=json&oauth_token='
};

//Cloudinary Confguration
	cloudy.config({
		cloud_name: process.env.CLOUDY_NAME,
		api_key: process.env.CLOUDY_API_KEY,
		api_secret: process.env.CLOUDY_SECRET
	});

// Get port
var PORT = process.env.PORT || process.env.APP_PORT || 8080;

//get postgres configuration
var credentials = process.env.DATABASE_URL || "postgres://" + process.env.DB_USER + ":" + process.env.DB_PASSWORD + "@" + process.env.DB_HOST + "/" + process.env.DB_NAME;

// get Google API credentials
var GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
var GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
var GOOGLE_AUTH_CALLBACK = process.env.GOOGLE_AUTH_CALLBACK;

// Setup static folder
app.use(express.static('public'));

// Session middleware
app.use(session({
  secret: 'hummingbearr',
  resave: true,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 360000 }
}));

// passport store and get user object
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// configure passport for google 
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_AUTH_CALLBACK
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      passportOptions.path += accessToken;
      var buff = '';
      var count = 0;
      var req = https.get(passportOptions, function(res) {
        res.on('data', function(d) {
          buff += d;
          // console.log('[passport.use accessToken]', count++);
        });
        res.on('end', function() {
          console.log('[passport.use accessToken end]', accessToken);
        });
      });
      // req.end();
      req.on('error', function(err) {
        console.log('[passport.use req.on error]', err);
      });
      // To keep the example simple, the user's Google profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Google account with a user record in your database,
      // and return that user instead.
      delete profile._raw;
      return done(null, profile);
    });
  }
));

// Body Parser
// app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use(passport.initialize());
app.use(passport.session());

app.get('/', ensureAuthenticated, function(req, res) {
	// console.log('[/]', req.user);
	res.sendFile(__dirname + '/index.html');
});

app.get('/login', function(req, res) {
	req.logout();
	res.sendFile(__dirname + '/login.html');
});

// session handeling
// passport based auth
app.get('/auth/google',
  passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 
  	'https://www.google.com/m8/feeds',
  	'email'] }),
  function(req, res){
    // The request will be redirected to Google for authentication, so this
    // function will not be called.
});

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// api for user data
app.get('/api/get/user', ensureAuthenticated, function(req, res) {
	// return loggedin user
	res.json(req.user);
});

// api for searching
app.get('/api/q/:search', ensureAuthenticated, function (req, res) {
	var search_query = req.params.search;

	if (search_query.match(/\:/)){
		//search with filter
			 serchFilter(search_query, function(result){
				if(!result){
					res.sendStatus(500);
				}
				else{
					res.json(result);
				}
				
			});
		}

	else {
		//search without user filter
		query('SELECT r.id, i.title, i.renter, i.image_url, i.description, r.name FROM items i LEFT OUTER JOIN renter r on i.renter = r.id WHERE LOWER(i.title) LIKE $1 OR LOWER(i.description) LIKE $1',['%'+search_query.toLowerCase()+'%'], function (err, result){
			if (!err) {
				res.json(result.rows);
			} else {
				console.log('[/api/q/:search]', err);
				res.sendStatus(500);
			}
		});
	}

});

//Item insert function
app.post('/api/add/item', function (req, res) {
	var title = req.body.title;
	var desc = req.body.description;
	var imageData = req.body.replacedImageData;
	query('INSERT INTO items(title, renter, description) VALUES($1,1,$2) returning id',[
		title, 
		desc
		], function (err, result){
			if(!err) {
				res.sendStatus(200);
				uploadImage(result.rows[0].id, imageData);
				console.log("[add item id]", result.rows[0].id);
			}
			else {
				console.log(err);
				res.sendStatus(500);
			}
	});
});

// User Insert, Update
app.get('/api/add/user/:user_name/:user_email/:user_mobile', function (req, res){
	query('INSERT INTO renter(name, email, mobile) VALUES($1, $2, $3)', [req.params.user_name, 
		req.params.user_email,
		req.params.user_mobile],function (err,result){
			if(!err){
				res.sendStatus(200);
			}
			else{
				console.log(err);
				res.sendStatus(500);
			}
		});

});

app.post('/api/update/user/', function(req, res) {
	if (req.body.id && req.body.user_name) {
		query('UPDATE renter SET name = $1 WHERE id = $2',
			[req.body.user_name, req.body.id],
			function (err, result) {
				if (!err) {
					res.sendStatus(200);
				} else {
					console.log(req.body.id, req.body.user_name, err);
					res.sendStatus(500);
				}
			});
	} else {
		res.sendStatus(400);
	}
});

//send sms

app.get('/api/send/sms/:id/:message', function(req,res){
	return; // FIXME remove this return to enable sms sending
	query('SELECT mobile FROM renter WHERE id = $1', [req.params.id],function(err,result){
		if(!err){
			console.log(result.rows[0].mobile);
			exotel.sendSMS(result.rows[0].mobile,req.params.message, function(err,result){
				if(!err){
					res.sendStatus(200);
				}
				else{
					console.log(err);
				res.sendStatus(500);

				}
			});
		}
		else{
			console.log(err);
				res.sendStatus(500);
		}

	});
	

});

// quering 
var query = function(sql, param, callback) {
	pg.connect(
		credentials, 
		function(err, client, done) {
			if (err) {
				console.log(err);
				callback(err);
			} else {
				client.query(sql, param, function(err, result) {
					done();
					callback(err, result);
				});
			}
		});
};

// Upload image 

var uploadImage = function(id,	imageData){
	cloudy.uploader.upload(imageData, function(response){
		query('UPDATE items SET image_url = $1 WHERE id = $2',[response.secure_url, id], function(err, result){
			if(!err){
				console.log("[server Image upload]", result, response);
			}
			else{
				console.log(err);
			}
		});
	}); 
};


//Search Filter

var serchFilter = function (q,callback){
	var queryArray = [];
	var querry = q.split(/\s(.+)/); //  ["user:azad", "My word", ""]
	queryArray.push(querry[1]); // ["My word"]
	queryArray.push.apply(queryArray, querry[0].split(':')); // ["My Word", "user", "azad"]
	console.log(queryArray);

	//if no keyword found 
	if(!queryArray[0]){
		console.log(queryArray[2]);
		query('SELECT r.id, i.title, i.renter, i.image_url, i.description, r.name FROM items i LEFT OUTER JOIN renter r ON i.renter = r.id WHERE LOWER(r.name) LIKE $1', ['%'+queryArray[2].toLowerCase()+'%'] , function(err, result){
				if(!err){
					// console.log("[Hiee]", result.rows)
					callback(result.rows);
				}
				else{
					callback(err);

				}
		});

	}
	else{

		query('SELECT r.id, i.title, i.renter, i.image_url, i.description, r.name FROM items i LEFT OUTER JOIN renter r ON i.renter = r.id WHERE LOWER(r.name) LIKE $1 AND (LOWER(i.title) LIKE $2 OR LOWER(i.description) LIKE $2)', ['%'+queryArray[2].toLowerCase()+'%', '%'+queryArray[0].toLowerCase()+'%' ] , function(err, result){
				if(!err){
					// console.log("[Hiee]", result.rows)
					callback(result.rows);
				}
				else{
					callback(err);

				}
		});

	}

};

function ensureAuthenticated (req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
};


http.listen(PORT, function() {
	console.log('Running on http://localhost:' + PORT);
});


// SELECT r.id, i.title, i.renter, i.image_url, i.description, r.name FROM items i LEFT OUTER JOIN renter r ON i.renter = r.id WHERE LOWER(r.name) LIKE $1'