var Twitter = require('twitter');
var fs = require('fs');
var constants = require('./constants.js');

// NO TOCAR. Puedes bloquear la cuenta. Max: 1 petición por minuto
var requestIntervalTime = 60000;

// Máxima longitud de un tweet
var TWEET_MAX_LENGTH = 140;

var client = new Twitter({
  consumer_key: constants.auth.CONSUMER_KEY,
  consumer_secret: constants.auth.CONSUMER_SECRET,
  access_token_key: constants.auth.ACCESS_TOKEN_KEY,
  access_token_secret: constants.auth.ACCESS_TOKEN_SECRET,
});

// -------------------------------------------------------
// Randombot: pone tweets con números aleatorios
// -------------------------------------------------------
var startRandombot = function() {

	// Peticiones cíclicas
	var message;
	botId = setInterval(function() {

		// Generamos mensaje
		message = Math.round(Math.random()*1000);

		client.post('statuses/update', {status: message},  function(error, tweet, response) {
		  if (error) {
				console.log(error);
			} else {
				console.log(tweet);
			}
		});

	}, requestIntervalTime);

  return botId;
};

// -------------------------------------------------------
// Readboot lee un texto y tuitea todas sus frases de menos de 140 caracteres aleatoriamente
// -------------------------------------------------------
var startReadbot = function() {

  var p = new Promise(function(resolve, reject) {

    // Leemos las frases
    fs.readFile('./texto.txt', 'utf8', function (err, data) {
      var pos;
      var phrases = [];
      var message;
      var text = data.replace(/\n/g, " ");
      var allPhrases = text.split(".");

      // Nos quedamos con las que tienen un tamaño apto para el twiteo
      for (let phrase of allPhrases) {
        if (phrase.length <= TWEET_MAX_LENGTH) {
          phrases.push(phrase);
        }
      }

      // Peticiones cíclicas
      var botId = setInterval(function() {

        // Seleccionamos una frase aleatoria
        pos = Math.round(Math.random() * (phrases.length - 1));
        if (phrases[pos].trim()) {
          message = (phrases[pos]+".").trim().substr(0, 140);

          client.post('statuses/update', {status: message},  function(error, tweet, response) {
            if (error) {
              console.log(error);
            } else {
              console.log(tweet);
            }
          });
        }

      }, requestIntervalTime);

      resolve(botId);
    });

  });

  return p;



};

// Parar
var stopBot = function(botId) {
  if (botId) {
		clearInterval(botId);
	}
};

exports.startRandombot = startRandombot;
exports.startReadbot = startReadbot;
exports.stopBot = stopBot;
