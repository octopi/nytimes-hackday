var express = require('express'),
ig = require('instagram-node').instagram(),
async = require('async'),
Twit = require('twit'),
request = require('request'),
_ = require('underscore');

var app = express();
app.use(express.logger());
app.use(express.bodyParser());

var T = new Twit({
    consumer_key:         'MTZybNXiQNEY6JnRisn3w'
  , consumer_secret:      '5QhVVzgxaEIaeuuDBijwjCIDCVo5oTHXfNRyu8cKpQ'
  , access_token:         '2198291923-SHFJvkZSwWLx5phY7JZFjsjpRtN39bWHJqOMuXA'
  , access_token_secret:  'vlw1xRRlsF00Rpa9frdgXVBGSIIJk7sDBJD1O5i7zU0uY'
})

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

var pullFromTwitter = function() {
  console.log('Checking Trending...');
  T.post('statuses/update', { status: 'Automated tweet - test' }, function(err, reply) {
  	console.log(err, reply);
	})
  getNYTimesTrending(function (facets) {

  	console.log(Object.keys(facets));
	  
	  	var stream = T.stream('statuses/filter', { track: 'instagram com', language: 'en' })
		stream.on('tweet', function (tweet) {
			if(tweet.entities.urls.length > 0)
			{
				for(var x = 0; x < tweet.entities.urls.length; x++)
				{
					if(tweet.entities.urls[x].expanded_url.indexOf("instagram.com") !== -1) {

						var checkString = ["RT"];
						if(checkFacets(tweet.text, Object.keys(facets))) {
							console.log(tweet.text);
							console.log(tweet.entities.urls[x].expanded_url);
							
						}
					}
				}
				
			}
	  		
		})

		var checkFacets = function(str, arr){
	   		for(var i=0; i < arr.length; i++){
	   			var keywords = arr[i].split();
	   			for(var j = 0; j < keywords.length; j++) {
	   				if(str.toLowerCase().indexOf(keywords[j].toLowerCase()) !== -1){
	       				console.log("FOUND A MATCH FOR "+keywords[j]);
	           			return true;
	   				}
	       		}
	   		}
	   		return false;
		}
	});
};
var makeComment = function(instagramUrl) {};

pullFromTwitter();

app.get('/', function(req, res) {
});


var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
