var Twitter = require('twit');
var constants = require('./constants.js');
var fs = require("fs");

// Máxima longitud de un tweet
var TWEET_MAX_LENGTH = 140;

// NO TOCAR. Puedes bloquear la cuenta. Max: 1 petición por minuto
var TWITTER_INTERACTION_INTERVAL_TIME = 3000;

var Twitter = new Twitter({
    consumer_key: constants.auth.CONSUMER_KEY,
    consumer_secret: constants.auth.CONSUMER_SECRET,
    access_token: constants.auth.ACCESS_TOKEN_KEY,
    access_token_secret: constants.auth.ACCESS_TOKEN_SECRET,
});


// ---------------------------------------------------------------------------
// Replybot: Responde los tweets recibidos
// ---------------------------------------------------------------------------
var startReplybot = function() {
    // TODO
};

// -------------------------------------------------------
// Retweetbot: retweetea tweets de las tendencias actuales
// -------------------------------------------------------
var startRetweetbot = function() {

    // Obtengo las tendencias
    getTrends().then(function(trends) {
        
        // Me quedo con una tendencia aleatorio y obtengo sus últimos tweets
        getTweetsForTrend(trends[Math.floor(Math.random() * trends.length)]).then(function(tweets) {

            // Retuiteo el primer tweet válido de la lista
            for (let tweet of tweets) {
                if (has_ascii_chars(tweet.user.name)) {                    
                    retweet(tweet);
                    console.log(tweet);
                    break;
                }
            };
        });
    });
};

// -------------------------------------------------------
// Randombot: pone tweets con números aleatorios
// -------------------------------------------------------
var startRandombot = function() {

    // Peticiones cíclicas
    var message;
    botId = setInterval(function() {

        // Generamos mensaje
        message = Math.round(Math.random() * 1000);
        post(message);

    }, REQ_INT_TIME);

    return botId;
};

// -----------------------------------------------------------------------------------------
// Readboot lee un texto y tuitea todas sus frases de menos de 140 caracteres aleatoriamente
// -----------------------------------------------------------------------------------------
var startReadbot = function() {

    var p = new Promise(function(resolve, reject) {

        // Leemos las frases
        fs.readFile('./texto.txt', 'utf8', function(err, data) {
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
                    message = (phrases[pos] + ".").trim().substr(0, 140);
                    post(message);
                }

            }, REQ_INT_TIME);

            resolve(botId);
        });

    });

    return p;
};



// ---------------------------------------------------------------------------
// Funciones privadas
// ---------------------------------------------------------------------------

// Obtiene las tendencias de la zona que se especifique en id
var getTrends = function() {
    var params = {
        id: 23424950 // Spain
    };

    var p = new Promise(function(resolve, reject) {
        Twitter.get('trends/place', params, function(err, data) {
            if (!err) {
                var trends = data[0].trends;
                resolve(trends);
            } else {
                console.log('ERROR|action:getTrends|', err);
                return [];
            }
        })
    });

    return p;
};

// Retwitea un tweet
var retweet = function(tweet) {

    return new Promise(function(resolve, reject) {

        Twitter.post('statuses/retweet/:id', {
            id: tweet.id_str
        }, function(err, response) {
            if (err) {
                console.log('ERROR|action:retweet', err);
            } else {
                console.log("action:retweet|tweet:" + tweet.id);
            }
        })
    }); 
};

// Obtiene los últimos tweets de una tendencia
var getTweetsForTrend = function(trend) {
    
    return new Promise(function(resolve, reject) {
        var params = {
            q: trend.name,
            result_type: 'recent',
            lang: 'en'
        };

        Twitter.get('search/tweets', params, function(err, data) {
            if (!err) {
                resolve(data.statuses);
            } else {
                console.log('Error|action:getLastTweetForTrend|', err);
            }
        });
    });
};

// Responde un tweet
var reply = function(tweet, message) {

    Twitter.post('statuses/update', {
        status: message,
        in_reply_to_status_id: tweet.id
    }, function(err, response) {
        if (err) {
            console.log('Error when REPLYING', err);
        } else {
            console.log("action:reply|message:" + message + "|tweet:" + tweet.id);
        }
    });
};

// Postea un mensaje
var post = function(message) {

    Twitter.post('statuses/update', {
        status: message
    }, function(error, tweet, response) {
        if (error) {
            console.log(error);
        } else {
            console.log(tweet);
        }
    });
};

// Comprueba si un string tiene caracteres no ascii
var has_ascii_chars = function(str) {
    var ascii = /^[ -~]+$/;

    if (ascii.test(str)) {
        return true;
    }
    return false;
};

// Parar bot
var stopBot = function(botId) {
    if (botId) {
        clearInterval(botId);
    }
};



// Se exportan las funciones de los bots
exports.startReplybot = startReplybot;
exports.startRetweetbot = startRetweetbot;
exports.startRandombot = startRandombot;
exports.startReadbot = startReadbot;
exports.stopBot = stopBot;
