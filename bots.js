var Twitter = require('twitter');
var constants = require('./constants.js');

// NO TOCAR. Puedes bloquear la cuenta. Max: 1 petición por minuto
var requestIntervalTime = 60000;

var client = new Twitter({
  consumer_key: constants.auth.CONSUMER_KEY,
  consumer_secret: constants.auth.CONSUMER_SECRET,
  access_token_key: constants.auth.ACCESS_TOKEN_KEY,
  access_token_secret: constants.auth.ACCESS_TOKEN_SECRET,
});

// -------------------------------------------------------
// Tweetbot: pone tweets de contenido aleatorio
// -------------------------------------------------------

// Tweetbot escribe tweets
var startTweetbot = function() {

	// Peticiones cíclicas
	var message;
	botId = setInterval(function() {

		// Generamos mensaje
		message = 'Mocabot dice:' + Math.round(Math.random()*1000);

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

// Parar
var stopBot = function(botId) {
  if (botId) {
		clearInterval(botId);
	}
};

exports.startTweetbot = startTweetbot;
exports.stopBot = stopBot;
