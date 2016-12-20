var Twitter = require('twit');
var constants = require('./constants.js');
var fs = require("fs");

// NO TOCAR. Puedes bloquear la cuenta. Max: 1 petición por minuto
var REQ_INT_TIME = 60000; // Request interval time
var POST_INT_TIME = REQ_INT_TIME * 2;
var RETWEET_INT_TIME = REQ_INT_TIME * 3;
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
            rand = Math.floor(Math.random() * array.length);
            messages.push(array[rand]);
        }
        callback(messages);
    }
};

// Se obtienen los tweets a twitear
var getTwitsForReply = function(callback) {
    var a = getMsgFromFile(REPLIES_FILE);
    getRandomMessages(a, callback);
};

// Se obtienen los tweets a twitear
var getTwitsToPost = function(callback) {
    var a1 = getMsgFromFile(TWITS_FILE);
    var a2 = getMsgFromReddit();
    var a = a1.concat(a2);
    getRandomMessages(a, callback);
};

// Genera un mensaje de respuesta con la mencion del autor (necesaria para el
// reply de twitter con id de user)
var generateTweetForReply = function(user_name, callback) {
    getTwitsForReply(function(messages) {
        var rand_init = Math.floor(Math.random() * messages.length);
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
var generateTwits = function(callback) {
    var twitts_to_post = [];
    getTwitsToPost(function(received_tweets) {
        console.log("twitts_to_post(%d): %s...", received_tweets.length, received_tweets[0]);
        getTrends(function(trends) {
            console.log("trends(%d): %s...", trends.length, trends[0]);
            for (var i = 0; i < trends.length; i++) {
                var rand_init = Math.floor(Math.random() * received_tweets.length);
                var rand_trend = Math.floor(Math.random() * trends.length);
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
var hasNonAsciiChars = function(str) {
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
var postTweet = function(message) {
    Twitter.post('statuses/update', {
        status: message
    }, function(error, tweet, response) {
        if (error) {
            console.log(error);
        }
    });
};

// Obtiene las tendencias de la zona que se especifique en id
var getTrends = function(callback) {
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
            console.log('Error in getTrends:', err);
            return [];
        }
    });
};

// Busca el último tweet que contiene la tendencia 'trend' y lo retweetea
// Ej: trend = '#nodejs'
var retweet = function(trend) {
    var params = {
        q: trend, // REQUIRED
        result_type: 'recent',
        lang: 'en'
    };

    // for more parametes, see: https://dev.twitter.com/rest/reference/get/search/tweets
    Twitter.get('search/tweets', params, function(err, data) {
        if (!err) {
            var retweetId = data.statuses[0].id_str;

            Twitter.post('statuses/retweet/:id', {
                id: retweetId
            }, function(err, response) {
                if (err) {
                    console.log('Error when RETWEETING', err);
                }
            });
        } else {
            console.log('Error when SEARCHING...', err);
        }
    });
};

// Busca el último tweet que contiene la tendencia 'trend' y lo contesta
// Ej: trend = '#nodejs'
var reply = function(trend) {
    var params = {
        q: trend, // REQUIRED
        result_type: 'recent',
        lang: 'en'
    };
    Twitter.get('search/tweets', params, function(err, data) {
        if (!err) {
            var tweet_to_reply;
            var in_reply_to_status_id;
            var user_name;

            for (var i = 0; i < data.statuses.length; i++) {
                tweet_to_reply = data.statuses[i];
                in_reply_to_status_id = tweet_to_reply.id;
                user_name = tweet_to_reply.user.name;
                if (!hasNonAsciiChars(user_name)) {
                    break;
                }
            }

            generateTweetForReply(user_name, function(message) {
                Twitter.post('statuses/update', {
                    status: message,
                    in_reply_to_status_id: in_reply_to_status_id
                }, function(err, response) {
                    if (err) {
                        console.log('Error when REPLYING', err);
                    }
                    console.log('Yuhu! Response: %s', response.text);
                });

            });
        } else {
            console.log('Error when SEARCHING...', err);
        }
    });
};

////////////////////////////////////////////////////////////////////////////////
//// Bot functions
////////////////////////////////////////////////////////////////////////////////

// Bots que interactuan con la API de Twitter
var startTweetbot = function() {

    reply('#Trump');
    generateTwits(function(twitts, trends) {

        var postBotId = setInterval(function() {
            console.log("INIT postBot");
            if (twitts.length > 0) {
                var rand_init = Math.floor(Math.random() * twitts.length);
                postTweet(twitts[rand_init]);
                console.log('Message: ', twitts[rand_init]);
            }
        }, POST_INT_TIME);

        var retweetBotId = setInterval(function() {
            console.log("INIT retweetBot");
            if (trends.length > 0) {
                var rand_trends_init = Math.floor(Math.random() * trends.length);
                retweet(trends[rand_trends_init]);
                console.log('Trend: ', trends[rand_trends_init]);
            }
        }, RETWEET_INT_TIME);

        var trendsBotId = setInterval(function() {
            console.log("INIT generateBot");
            generateTwits(function(tw, tr) {
                twitts = tw;
                trends = tr;
            });
        }, REF_TRENDS_INT_TIME);

        return [trendsBotId, postBotId, retweetBotId];
    });

};

// Parar bots
var stopBots = function(botIds) {
    for (var i = 0; i < botIds.length; i++) {
        if (botIds[i]) {
            clearInterval(botIds[i]);
        }
    }
};

// Se exportan las funciones de los bots
exports.startTweetbot = startTweetbot;
exports.stopBots = stopBots;
