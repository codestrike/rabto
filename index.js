'use strict';

var express = require('express');
var app = express();
var pg = require('pg');
var http = require('http').Server(app);
var env = require('node-env-file');
var session = require('express-session');
var bodyParser = require('body-parser');
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
// app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

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
	var email = req.body.email;
	var pass = req.body.pass;
	if (pass && email) {
		query('SELECT pass FROM renter WHERE email=$1', [email], function(err, result) {
			if (!err) {
				if (result.rows && result.rows[0] && result.rows[0].pass == pass) {
					// Cool. Start a session
					var sess = req.session;
					sess.email = email;
					sess.save();
				}
				res.json({
					err: null,
					location: '/?i=o'
				});
			} else {
				console.log(err);
				res.sendStatus(500);
			}
		});
	} else {
		res.sendStatus(403);
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
		query('SELECT r.id, i.title, i.renter, i.image_url, i.description, r.name FROM items i LEFT OUTER JOIN renter r on i.renter = r.id WHERE i.title LIKE $1 OR i.description LIKE $1',['%'+search_query+'%'], function (err, result){
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
	var title = req.body.title.toLowerCase();
	var desc = req.body.description.toLowerCase();
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

}


http.listen(PORT, function() {
	console.log('Running on http://localhost:' + PORT);
});


// SELECT r.id, i.title, i.renter, i.image_url, i.description, r.name FROM items i LEFT OUTER JOIN renter r ON i.renter = r.id WHERE LOWER(r.name) LIKE $1'