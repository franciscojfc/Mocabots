document.addEventListener("DOMContentLoaded", function(event) {

  // Invoca al randombot
	document.querySelector(".startRandombot").onclick = function() {
		stopCurrentBot();
		httpGetAsync("/bot/random/start", function() {
			document.querySelector(".randombotStatus").style.backgroundColor = 'green';
		});
	};

  // Invoca al readbot
	document.querySelector(".startReadbot").onclick = function() {
		stopCurrentBot();
   		httpGetAsync("/bot/read/start", function() {
			document.querySelector(".readbotStatus").style.backgroundColor = 'green';
		});
	};

	// Invoca al replybot
	document.querySelector(".startReplybot").onclick = function() {
		stopCurrentBot();
		httpGetAsync("/bot/reply/start", function() {
			document.querySelector(".replybotStatus").style.backgroundColor = 'green';
		});
	};

	// Invoca al retweetbot
	document.querySelector(".startRetweetbot").onclick = function() {
		stopCurrentBot();
		httpGetAsync("/bot/retweet/start", function() {
			document.querySelector(".retweetbotStatus").style.backgroundColor = 'green';
		});
	};

  	// Botones para parar los bots
	var stopButtons = document.getElementsByClassName("stopCurrentBot");
	for (let button of stopButtons) {
		button.onclick = stopCurrentBot;
	}

});



// ----------------------------------------------------
// Funciones privadas
// ----------------------------------------------------

// Petición GET genérica
var httpGetAsync = function(theUrl, callback)
{
		var xmlHttp = new XMLHttpRequest();
		xmlHttp.onreadystatechange = function() {
				if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
						callback(xmlHttp.responseText);
		};
		xmlHttp.open("GET", theUrl, true); // true for asynchronous
		xmlHttp.send(null);
}

// Para el bot que esté en curso
var stopCurrentBot = function() {
	httpGetAsync("/bot/stop", function() {
		document.querySelector(".randombotStatus").style.backgroundColor = 'red';
		document.querySelector(".readbotStatus").style.backgroundColor = 'red';
		document.querySelector(".replybotStatus").style.backgroundColor = 'red';
		document.querySelector(".retweetbotStatus").style.backgroundColor = 'red';
	});
};
