'use strict';

var express = require('express');
var app = express();
var pg = require('pg');
var http = require('http').Server(app);
var env = require('node-env-file');
var session = require('express-session');
var bodyParser = require('body-parser');

try {
	env(__dirname + '/.env');
} catch(err) {
	console.log('[Looks like heroku]');
}

var exotel = require('exotel')({
    id   : process.env.EXOTEL_ID, 
    token: process.env.EXOTEL_TOCKEN 
});


// Get port
var PORT = process.env.PORT || process.env.APP_PORT || 8080;

//get postgres configuration
var credentials = process.env.DATABASE_URL || "postgres://" + process.env.DB_USER + ":" + process.env.DB_PASSWORD + "@" + process.env.DB_HOST + "/" + process.env.DB_NAME;


// Setup static folder
app.use(express.static('public'));

// Session middleware
app.use(session({
  secret: 'hummingbearr',
  resave: true,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 360000 }
}));

// Body Parser
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
	var sess = req.session;
	if (sess.email) {
		res.sendFile(__dirname + '/index.html');
	} else {
		res.sendFile(__dirname + '/login.html');
	}
});

// session handeling
app.post('/session/start/', function (req, res) {
	var name = req.body.name;
	var email = req.body.email;
	if (name && email) {
		query('SELECT name FROM renter WHERE email=$1', [email], function(err, result) {
			if (!err) {
				if (result.rows && result.rows[0].name == name) {
					// Cool. Start a session
					var sess = req.session;
					sess.email = email;
					sess.save();
				}
				res.redirect('/?i=o');
			} else {
				console.log(err);
			}
		});
	}
});

app.get('/session/end', function (req, res) {
	req.session.destroy(function(err) {
		if (err) console.log(err);
		res.redirect('/?o=i');
	});
})

// api for searching
app.get('/api/q/:search', function (req, res) {
	var search_query = req.params.search.toLowerCase();
	query('SELECT r.id, i.title, i.renter, i.description, r.name FROM items i LEFT OUTER JOIN renter r on i.renter = r.id WHERE i.title LIKE $1 OR i.description LIKE $1',['%'+search_query+'%'], function (err, result){
		if (!err) {
			res.json(result.rows);
		} else {
			console.log('[/api/q/:search]', err);
			res.sendStatus(500);
		}
	});

});

//Item insert function
app.get('/api/add/item/:title/:desc', function (req, res) {
	query('INSERT INTO items(title, renter, description) VALUES($1,1,$2)',[
		req.params.title.toLowerCase(), 
		req.params.desc.toLowerCase()
		], function (err, result){
			if(!err) {
				res.sendStatus(200);
			}
			else {
				console.log(err);
				res.sendStatus(500);
			}
	});
});

// User Insert 
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






http.listen(PORT, function() {
	console.log('Running on http://localhost:' + PORT);
});
