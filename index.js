var express = require('express');
var path = require('path');
var Twitter = require('twitter');
var bots = require('./bots.js');
var app = express();

const PORT = 8080;

// Id del bot en curso
var currentBotId;

// -------------------------------------------------------
// Estáticos
// -------------------------------------------------------
app.use(express.static('public'));

// -------------------------------------------------------
// Routing
// -------------------------------------------------------

// Raíz
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

// Arrancar randombot
app.get('/bot/random/start', function(req, res) {
  currentBotId = bots.startRandombot();
  res.sendFile(path.join(__dirname + '/index.html'));
});

// Arrancar readbot
app.get('/bot/read/start', function(req, res) {

  bots.startReadbot().then(function(value) {
    currentBotId = value;
  });
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
