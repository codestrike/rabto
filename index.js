'use strict';

var express = require('express');
var pg = require('pg');

// Get port
var PORT = process.env.PORT || 8080;

// App
var app = express();

// Setup static folder
app.use(express.static('public'));

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.get('/api/q/:search', function (req, res) {
var search_query = req.params.search;

});

app.listen(PORT);
console.log('Running on http://localhost:' + PORT);
