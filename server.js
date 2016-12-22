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
var botIds=[];

// -------------------------------------------------------
// Estáticos
// -------------------------------------------------------
app.use(express.static('public'));

// -------------------------------------------------------
// Routing
// -------------------------------------------------------

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/bot/tweet/start', function(req, res) {
	botIds.push(bots.startTweetbot());

  res.sendFile(path.join(__dirname + '/index.html'));
});

// Arrancar randombot
app.get('/bot/random/start', function(req, res) {
  botIds.push(bots.startRandombot());
  res.sendFile(path.join(__dirname + '/index.html'));
});

// Arrancar readbot
app.get('/bot/read/start', function(req, res) {

  bots.startReadbot().then(function(value) {
    botIds.push(value);
  });
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/bot/stop', function(req, res) {
  for (var i = 0; i < botIds.length; i++) {
    bots.stopBot(botIds[i]);
  }
	botIds = [];
  res.sendFile(path.join(__dirname + '/index.html'));
});

// -------------------------------------------------------
// Arranco el servidor
// -------------------------------------------------------

app.listen(PORT);
console.log("Servidor arrancado en puerto " + PORT);
