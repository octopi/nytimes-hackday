var express = require('express'),
ig = require('instagram-node').instagram(),
async = require('async'),
Twit = require('twit'),
request = require('request');

var app = express();
app.use(express.logger());
app.use(express.bodyParser());

var T = new Twit({
    consumer_key:         'mQra7aCPJjI3tzqvP6Icw'
  , consumer_secret:      'HWbc7P6jEGHQDPSOSeSBn4kJu739nMw4czmkQDueQZY'
  , access_token:         '20206051-KNUVBKic9XyG5GVBZuVf180hLqsiI1HWUpQcGD4Bb'
  , access_token_secret:  'AZAmGHoPFZtVvOw5yQ8A6zDD5mGe6NPZnrGFvRzYHBLHx'
})

var getNYTimesTrending = function() {

  return {
    'USA': 'http://nytimes.com/url',
    'thanksgiving': 'http://nytimes.com/url'
  };
};

var pullFromTwitter = function() {
  console.log('yo');
  var stream = T.stream('statuses/filter', { track: 'instagram com', language: 'en' })

	stream.on('tweet', function (tweet) {
		if(tweet.entities.urls.length > 0)
		{
			for(var x = 0; x < tweet.entities.urls.length; x++)
			{
				if(tweet.entities.urls[x].expanded_url.indexOf("instagram.com") !== -1)
				{
					console.log(tweet.text)
					console.log(tweet.entities.urls[x].expanded_url)
				}
			}
			
		}
  		
	})
};
var makeComment = function(instagramUrl) {};

pullFromTwitter();

app.get('/', function(req, res) {
});


var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
