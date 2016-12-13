var express = require('express');
var app = express();
var path = require('path');
var http = require('http');
var url = require("url");
var request = require('request');
var Twitter = require('twitter');
var bots = require('./bots.js');

const PORT = 8080;

// Id del bot en curso
var currentBotId;

// -------------------------------------------------------
// Routing
// -------------------------------------------------------

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/bot/tweet/start', function(req, res) {
	currentBotId = bots.startTweetbot();
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/bot/stop', function(req, res) {
	bots.stopBot(currentBotId);
	currentBotId = null;
  res.sendFile(path.join(__dirname + '/index.html'));
});


// -------------------------------------------------------
// Arranco el servidor
// -------------------------------------------------------

app.listen(PORT);
console.log("Servidor arrancado en puerto " + PORT);
