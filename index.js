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

app.get('/api/q/:search', function (req, res) {
var search_query = req.params.search;
query('select * from marker', '', function (err, m){
	(!err)? res.json(m.rows) : res.json({"q":search_query})	
})

});

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
