var Twitter = require('twit');
var constants = require('./constants.js');
var fs = require("fs");

// Máxima longitud de un tweet
var TWEET_MAX_LENGTH = 140;

// NO TOCAR. Puedes bloquear la cuenta. Max: 1 petición por minuto
var REQ_INT_TIME = 60000; // Request interval time
var POST_INT_TIME = REQ_INT_TIME * 3;
var REPLY_INT_TIME = REQ_INT_TIME * 6;
var RETWEET_INT_TIME = REQ_INT_TIME * 5;
var REF_TRENDS_INT_TIME = REQ_INT_TIME * 15;


var Twitter = new Twitter({
    consumer_key: constants.auth.CONSUMER_KEY,
    consumer_secret: constants.auth.CONSUMER_SECRET,
    access_token: constants.auth.ACCESS_TOKEN_KEY,
    access_token_secret: constants.auth.ACCESS_TOKEN_SECRET,
});

var TWITS_FILE = __dirname + '/twits.txt';
var REPLIES_FILE = __dirname + '/replies.txt';

////////////////////////////////////////////////////////////////////////////////
//// Utility functions
////////////////////////////////////////////////////////////////////////////////

var gen_rand_num = function(max) {
    return Math.floor(Math.random() * max);
};


// Se obtienen los mensajes a twitear de un fichero de texto
var getMsgFromFile = function(file) {

    if (!file) {
        console.log('Error: incorrect file \'%s\'', file);
        return [];
    }
    // Coger los mensajes de un fichero
    var nl = require('os').EOL;

    var text = fs.readFileSync(file, 'utf8');
    var array = text.split(nl);
    console.log("File (%d)", array.length);
    return array;
};

// Se obtienen los mensajes a twitear de una pagina de reddit
var getMsgFromReddit = function() {

    reddit = require('redwrap');
    var messages = [];
    reddit.list().hot().sort('new').from('year').limit(40, function(err, data, res) {
        if (err) {
            console.log('Error when accessing Reddit: %s', err); //outputs any errors
        }
        for (var i = 0; i < data.data.children.length; i++) {
            messages.push(data.data.children[i].data.title);
        }
        console.log('Reddit (%d)', data.data.children.length);
        return messages;
    });
};

// Se obtienen n mensajes aleatorios del array y se llama a la funcion de callback
var getRandomMessages = function(array, callback) {

    var max_twits = 50;
    if (array.length < max_twits) {
        callback(array);
    } else {
        var messages = [];
        var rand;
        // Se obtienen n mensajes aleatorios del array
        for (var i = 0; i < max_twits; i++) {
            rand = gen_rand_num(array.length);
            messages.push(array[rand]);
        }
        callback(messages);
    }
};

// Se obtienen los tweets a twitear
var get_tweets_for_reply = function(callback) {

    var a = getMsgFromFile(REPLIES_FILE);
    getRandomMessages(a, callback);
};

// Se obtienen los tweets a twitear
var get_twits_to_post = function(callback) {

    var a1 = getMsgFromFile(TWITS_FILE);
    var a2 = getMsgFromReddit();
    var a = a1.concat(a2);
    getRandomMessages(a, callback);
};

// Genera un mensaje de respuesta con la mencion del autor (necesaria para el
// reply de twitter con id de user)
var gen_tweet_for_reply = function(user_name, callback) {

    get_tweets_for_reply(function(messages) {
        var rand_init = gen_rand_num(messages.length);
        // Generamos mensajes
        var message = '@' + user_name + ' ' + messages[rand_init];
        if (message.length > 140) {
            message = message.substring(0, 139);
        }
        callback(message);
    });
};

// Obtiene las tendencias de Twitter y genera mensajes conteniendo alguna de
// forma aleatoria
var gen_tweets = function(callback) {

    var twitts_to_post = [];
    get_twits_to_post(function(received_tweets) {
        console.log("twitts_to_post(%d): %s...", received_tweets.length, received_tweets[0]);
        get_trends(function(trends) {
            console.log("trends(%d): %s...", trends.length, trends[0]);
            for (var i = 0; i < trends.length; i++) {
                var rand_init = gen_rand_num(received_tweets.length);
                var rand_trend = gen_rand_num(trends.length);
                // Generamos mensajes
                var message = received_tweets[rand_init] + ' ' + trends[rand_trend];
                if (message.length > 140) {
                    message = message.substring(0, 139);
                }
                twitts_to_post.push(message);
            }
            callback(twitts_to_post, trends);
        });
    });
};

// Comprueba si un string tiene caracteres no ascii
var has_non_ascii_chars = function(str) {
    var ascii = /^[ -~]+$/;

    if (!ascii.test(str)) {
        return true;
    }
    return false;
};
////////////////////////////////////////////////////////////////////////////////
//// Twitter functions
////////////////////////////////////////////////////////////////////////////////

// Publicar el mensaje en Twitter
var post = function(message) {
    Twitter.post('statuses/update', {
        status: message
    }, function(error, tweet, response) {
        if (error) {
            console.log(error);
        }
    });
};

// Obtiene las tendencias de la zona que se especifique en id
var get_trends = function(callback) {
    var trendsAvaliable = [];
    var params = {
        id: 23424977 //24865675 Europa
    };
    Twitter.get('trends/place', params, function(err, data) {
        if (!err) {
            var trends = data[0].trends;
            for (var i = 0; i < trends.length; i++) {
                trendsAvaliable.push(trends[i].name);
            }
            callback(trendsAvaliable);
        } else {
            console.log('Error in get_trends:', err);
            return [];
        }
    });
};

// Obtiene el primer tweet valido de la lista 'list' y llama a la funcion de
// callback con este tweet
var get_valid_tweet = function(list, callback) {
    var tweet;
    var user_name;

    for (var i = 0; i < list.length; i++) {
        tweet = list[i];
        user_name = tweet.user.name;
        if (!has_non_ascii_chars(user_name)) {
            callback(tweet);
            return tweet;
        }
    }
    console.log('Error when GET TWEET...', err);
};

// Obtiene los tweets recientes con la tendencia 'trend' y llama a la funcion de
// callback con esta lista.
var get_recent_tweets = function(trend, callback) {
    var params = {
        q: trend, // REQUIRED
        result_type: 'recent',
        lang: 'en'
    };

    Twitter.get('search/tweets', params, function(err, data) {
        if (!err) {
            callback(data.statuses);
        } else {
            console.log('Error when SEARCHING...', err);
        }
    });
};

// Busca el último tweet que contiene la tendencia 'trend' y lo retweetea
// Ej: trend = '#nodejs'
var retweet = function(trend) {
    get_recent_tweets(trend, function(list) {
        get_valid_tweet(list, function(tweet) {
            Twitter.post('statuses/retweet/:id', {
                id: tweet.id
            }, function(err, response) {
                if (err) {
                    console.log('Error when RETWEETING', err);
                }
            });
        });
    });
};

// Busca el último tweet que contiene la tendencia 'trend' y lo contesta
// Ej: trend = '#nodejs'
var reply = function(trend) {
    get_recent_tweets(trend, function(list) {
        get_valid_tweet(list, function(tweet) {
            gen_tweet_for_reply(tweet.user.name, function(message) {
                Twitter.post('statuses/update', {
                    status: message,
                    in_reply_to_status_id: tweet.id
                }, function(err, response) {
                    if (err) {
                        console.log('Error when REPLYING', err);
                    }
                    console.log('Yuhu! Response: %s', response.text);
                });

            });
        });
    });
};

////////////////////////////////////////////////////////////////////////////////
//// Bot functions
////////////////////////////////////////////////////////////////////////////////

// -------------------------------------------------------
// Replybot: responde tweets con tendencias con mensajes
// cogidos de un fichero
// -------------------------------------------------------
var startReplyBot = function(){
  get_trends(function(trends) {
    return setInterval(function() {
      console.log("INIT replyBot");
      var rand_trend = gen_rand_num(trends.length);
      reply(trends[rand_trend]);
    }, REPLY_INT_TIME);
  });

};

// -------------------------------------------------------
// Retweetbot: retweetea tweets con tendencias
// -------------------------------------------------------
var startRetweetBot = function() {
  get_trends(function(trends) {
    return setInterval(function() {
        console.log("INIT retweetBot");
        var rand_trend = gen_rand_num(trends.length);
        retweet(trends[rand_trend]);
    }, RETWEET_INT_TIME);
  });
};


// Bots que interactuan con la API de Twitter
var startSmartbot = function() {
    gen_tweets(function(twitts, trends) {
        var trend;
        if (trends.length > 0) {
            var rand_trends_init = gen_rand_num(trends.length);
            trend = trends[rand_trends_init];
            console.log('Trend: ', trend);
        }
        var postBotId = setInterval(function() {
            console.log("INIT postBot");
            if (twitts.length > 0) {
                var rand_init = gen_rand_num(twitts.length);
                post(twitts[rand_init]);
                console.log('Message: ', twitts[rand_init]);
            }
        }, POST_INT_TIME);

        var replyBotId = startReplyBot();

        var retweetBotId = startRetweetBot();

        var trendsBotId = setInterval(function() {
            console.log("INIT generateBot");
            gen_tweets(function(tw, tr) {
                twitts = tw;
                trends = tr;
            });
        }, REF_TRENDS_INT_TIME);

        return [trendsBotId, replyBotId, postBotId, retweetBotId];
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

        Twitter.post('statuses/update', {
            status: message
        }, function(error, tweet, response) {
            if (error) {
                console.log(error);
            } else {
                console.log(tweet);
            }
        });

    }, REQ_INT_TIME);

    return botId;
};

// -------------------------------------------------------
// Readboot lee un texto y tuitea todas sus frases de menos de 140 caracteres aleatoriamente
// -------------------------------------------------------
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


                    Twitter.post('statuses/update', {
                        status: message
                    }, function(error, tweet, response) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log(tweet);
                        }
                    });
                }

            }, REQ_INT_TIME);

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


// Se exportan las funciones de los bots
exports.startSmartbot = startSmartbot;
exports.startReplyBot = startReplyBot;
exports.startRetweetBot = startRetweetBot;
exports.startRandombot = startRandombot;
exports.startReadbot = startReadbot;
exports.stopBot = stopBot;
