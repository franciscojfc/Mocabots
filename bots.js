var Twitter = require('twit');
var constants = require('./constants.js');

// NO TOCAR. Puedes bloquear la cuenta. Max: 1 petición por minuto
var requestIntervalTime = 60000;

var Twitter = new Twitter({
    consumer_key: constants.auth.CONSUMER_KEY,
    consumer_secret: constants.auth.CONSUMER_SECRET,
    access_token: constants.auth.ACCESS_TOKEN_KEY,
    access_token_secret: constants.auth.ACCESS_TOKEN_SECRET,
});

// -------------------------------------------------------
// Tweetbot: pone tweets de contenido aleatorio
// -------------------------------------------------------

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

// Concatena un string a otro con formato "str1, str2, str3"
var str_append = function(master, new_str) {
    if (master) {
        master = master.concat(', ' + new_str);
    } else {
        master = new_str;
    }
    return master;
};

// Obtiene las tendencias mundiales
var getTrends = function(callback) {
    var MAX_TRENDS = 5;
    var trendsAvaliable = [];
    var params = {
        id: 23424977 //24865675 Europa
    };
    Twitter.get('trends/place', params, function(err, data) {
        if (!err) {
            var trends = data[0].trends;
            var num_trends = trends.length;
            if (trends.length > MAX_TRENDS) {
                num_trends = MAX_TRENDS;
            }

            for (var i = 0; i < num_trends; i++) {
                trendsAvaliable.push(trends[i].name);
            }
            callback(trendsAvaliable);
            return trendsAvaliable;
        } else {
            console.log('Error in getTrends:', err);
            return [];
        }
    });
};

// find latest tweet according the query 'q' in params
// Ej: trends = '#nodejs, #Nodejs'
var retweet = function(trends, callback) {
    var params = {
        q: trends, // REQUIRED
        result_type: 'recent',
        lang: 'en'
    };

    // for more parametes, see: https://dev.twitter.com/rest/reference/get/search/tweets
    Twitter.get('search/tweets', params, function(err, data) {
        // if there no errors
        if (!err) {

            // grab ID of tweet to retweet
            var retweetId = data.statuses[0].id_str;

            // Tell TWITTER to retweet
            Twitter.post('statuses/retweet/:id', {
                id: retweetId
            }, function(err, response) {
                // if there was an error while tweeting
                if (err) {
                    console.log('Error when RETWEETING', err);
                }
                callback();
            });
        }
        // if unable to Search a tweet
        else {
            console.log('Error when SEARCHING...', err);
        }
    });
};

// Tweetbot escribe tweets
var startTweetbot = function() {

    // Peticiones cíclicas
    var message;
    botId = setInterval(function() {
        getTrends(function(trends) {

            for (var i = 0; i < trends.length; i++) {
                // Generamos mensaje
                message = 'Good bot! ' + trends[i] + ' ' + Math.round(Math.random() * 1000);
                retweet(trends[i],
                    // Publicamos el mensaje
                    postTweet(message)
                );
            }
        });

    }, requestIntervalTime * 10);

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
