'use strict';

var express = require('express');
var pg = require('pg');
var env = require('node-env-file');



env(__dirname + '/.env');
// Get port
var PORT = process.env.APP_PORT || 8080;

//get postgres configuration
var credentials = "postgres://" + process.env.DB_USER + ":" + process.env.DB_PASSWORD + "@" + process.env.DB_HOST + "/" + process.env.DB_NAME;
// App
var app = express();

// Setup static folder
app.use(express.static('public'));

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});
// api for searching
app.get('/api/q/:search', function (req, res) {
	var search_query = req.params.search;
	query('SELECT i.id, i.title, i.renter, r.name FROM items i LEFT OUTER JOIN renter r on i.renter = r.id WHERE i.title LIKE $1',['%'+search_query+'%'], function (err, result){
		(!err)? res.json(result.rows) : console.log(err);
	});

});

//Item insert function

app.get('/api/add/item/:title', function (req, res) {
	var itemTitle = req.params.title;
	query('INSERT INTO items(title, renter) VALUES($1,1)',[itemTitle],function (err, result){
		
		if(!err) {
			res.sendStatus(200)
		}
		else{
			console.log(err);
			res.sendStatus(500);
		}
	});
});



//quering finction
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






app.listen(PORT);
console.log('Running on http://localhost:' + PORT);
