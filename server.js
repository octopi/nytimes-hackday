var express = require('express'),
ig = require('instagram-node').instagram(),
async = require('async'),
Twit = require('twit'),
request = require('request'),
_ = require('underscore');

var app = express();
app.use(express.logger());
app.use(express.bodyParser());
ig.use({
  access_token: '5d4993b79c3e7697063c0dd5905d4c7f8f4c3a6537150f1688512de7e58bf429'
});

var T = new Twit({
    consumer_key:         'MTZybNXiQNEY6JnRisn3w'
  , consumer_secret:      '5QhVVzgxaEIaeuuDBijwjCIDCVo5oTHXfNRyu8cKpQ'
  , access_token:         '2198291923-SHFJvkZSwWLx5phY7JZFjsjpRtN39bWHJqOMuXA'
  , access_token_secret:  'vlw1xRRlsF00Rpa9frdgXVBGSIIJk7sDBJD1O5i7zU0uY'
})

var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var stream; // dat BIG STREAM

var getNYTimesTrending = function(callback) {
  var nytUrl = 'http://api.nytimes.com/svc/mostpopular/v2/mostshared/all-sections/1.json?api-key=c02874f3984ca7bfbd7a35d7e91ba730:16:43844472',
  facets = {};
  request(nytUrl, function(err, response, body) {
    if(!err && response.statusCode === 200) {
      var results = JSON.parse(body).results;
      for(var i = 0; i < results.length; i++) {
        var currArticle = results[i];
        _.each(currArticle.des_facet, addToFacets(currArticle.url));
        _.each(currArticle.org_facet, addToFacets(currArticle.url));
        _.each(currArticle.per_facet, addToFacets(currArticle.url));
        _.each(currArticle.geo_facet, addToFacets(currArticle.url));
      }
      callback(facets);
    }
  });

  var addToFacets = function(url) {
    return function(facet) {
      facets[facet] = url;
    };
  };
};

var pullFromTwitter = function(socket) {
  console.log('Checking Trending...');

  getNYTimesTrending(function (facets) {

  	console.log(facets);
	  
	  stream = T.stream('statuses/filter', { track: 'instagram com', language: 'en' });
		stream.on('tweet', function (tweet) {
			if(tweet.entities.urls.length > 0)
			{
				for(var x = 0; x < tweet.entities.urls.length; x++)
				{
					if(tweet.entities.urls[x].expanded_url.indexOf("instagram.com") !== -1) {
						var response = checkFacets(tweet.text, Object.keys(facets));
						if(response.length > 0) {
							response = "@" + tweet.user.screen_name + " " + response;
							console.log("RESPONSE ID : " + tweet.id);
							console.log("TWEETING RESPONSE: " + response);
							T.post('statuses/update', { status: response, in_reply_to_status_id: tweet.id_str}, function(err, reply) {
								console.log(err, reply);
							});
							console.log(tweet.text);
							console.log(tweet.entities.urls[x].expanded_url);

	      // send tweet to frontend
	      request('https://api.twitter.com/1/statuses/oembed.json?id=' + tweet.id_str, function(err, response, body) {
		socket.emit('newTweetSent', {
		  html: JSON.parse(body).html
		});
	      });
						}
					}
				}
			}
	  		
		});

		var checkFacets = function(str, arr){
	   		for(var i=0; i < arr.length; i++){
	   			var currentKey = arr[i];
	   			var keywords = currentKey.split(" ");
	   			for(var j = 0; j < keywords.length; j++) {
	   				if(keywords[j].length > 3){
	   					var currKeyword = keywords[j]+" ";
		   				if(str.toLowerCase().indexOf(currKeyword.toLowerCase()) !== -1){
		       				var response = "Check out this trending nytimes article on " + currentKey + " #educateyoself";
		       				response = response + " " + facets[currentKey];
		           			return response;
		   				}
	   				}
	       		}
	   		}
	   		return "";
		}
	});
};

pullFromTwitter();

app.get('/', function(req, res) {
  res.render('index.ejs');
});

io.sockets.on('connection', function (socket) {
  socket.on('stopStream', function(data) {
    console.log('stopping stream');
    stream.stop();
  });

  socket.on('restartStream', function(data) {
    if (!stream)
      pullFromTwitter(socket);
    else
      stream.start();
  });
});

var port = process.env.PORT || 5000;
server.listen(port, function() {
  console.log("Listening on " + port);
});
