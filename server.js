var express = require('express'),
ig = require('instagram-node').instagram(),
async = require('async'),
Twit = require('twit'),
request = require('request'),
_ = require('underscore');

var app = express();
app.use(express.logger());
app.use(express.bodyParser());
app.use(express.static(__dirname));
ig.use({
  access_token: '5d4993b79c3e7697063c0dd5905d4c7f8f4c3a6537150f1688512de7e58bf429'
});

var T = new Twit({
    consumer_key:         'OpzEUMolXAXIEmqpqQ'
  , consumer_secret:      'fm0FGPoAW1XKNilMWkZHDUbHTOzOoTGJaZVfNHffkk4'
  , access_token:         '2198620699-91Gs5gqwwdQnHsgEeVtgDynZwiw5F7sYxEtcwmN'
  , access_token_secret:  'ppSSrc17YHmgdgzdkfANIsNaMlCJUFDhnARj3UYG9OjeQ'
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
							console.log("RESPONSE ID : " + tweet.id);
							console.log("TWEETING RESPONSE: " + response);
              console.log('x is ', x, tweet.entities.urls[x]);
              (function(idx) {
                  T.post('statuses/update', { status: response }, function(err, reply) {
                    if(!err) {
                      // send tweet to frontend
                      request('https://api.twitter.com/1/statuses/oembed.json?id=' + reply.id_str, function(err, response, body) {
                        console.log(tweet.entities.urls, idx, tweet.entities.urls[idx]);
                        request('http://api.instagram.com/oembed?url=' + tweet.entities.urls[idx].expanded_url, function(inst_err, inst_response, inst_body) {
                          var inst = JSON.parse(inst_body);
                          if(inst.type === 'photo') {
                            socket.emit('newTweetSent', {
                              html: JSON.parse(body).html,
                              instagram: inst
                            });
                          }
                        });
                      });
                    } else {
                      console.log(err);
                    }
                  });
                  console.log(tweet.text);
                  console.log(tweet.entities.urls[idx].expanded_url);
              })(x);
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
		   				if(str.toLowerCase().indexOf('#' + currKeyword.toLowerCase()) !== -1){
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

app.get('/', function(req, res) {
 //  T.get('trends/place', {id : '2459115'}, function(err, reply) {
 //  		console.log("TWITTER TRENDS: ", reply, err);
 //  		var trending = [];
 //  		for(var x = 0; x < reply[0].trends.length; x++)
 //  		{
 //  			trending[x] = reply[0].trends[x].name;
 //  		}
 //  		console.log(trending);
 //  		res.render('index.ejs', {t:trending});
	// });
   T.get('statuses/user_timeline', {screen_name: 'timesteens', count : '10'}, function(err, reply) {
  	console.log("MOST RECENT TWEETS: ")
  	var results = [];
  	console.log(reply);
  	var initialData = [];
  	async.each(reply, function (item, callback){
  		if(item.in_reply_to_status_id_str) {
  			async.parallel({
  				twitter: function(cb) {
  					request('https://api.twitter.com/1/statuses/oembed.json?id=' + item.id_str, function(err, response, body) {
  						cb(null, JSON.parse(body).html);
  					});
  				},
  				inst: function(cb) {
  					T.get('statuses/show/:id' , {id: item.in_reply_to_status_id_str}, function(err, reply) {
  						for(var idx = 0; idx < reply.entities.urls.length; idx++) {
  							if(reply.entities.urls[idx].expanded_url.indexOf('instagram.com') != -1) {
  								request('http://api.instagram.com/oembed?url=' + reply.entities.urls[idx].expanded_url, function(inst_err, inst_response, inst_body) {
  									cb(null, JSON.parse(inst_body));
  								});
  							}
  						}
  					})
  				}
  				},
  				function(err, results) {
  					console.log('HERE', results);
  					initialData.push(results);
  					callback();
  				}
  			);
  		} else {
  			callback();
  		}

  	}, function (err) {
  		console.log('initialData', initialData);
  		res.render('index.ejs', {data: initialData});
  	});
	});
});

app.get('/educate', function(req, res) {
  res.render('educate.ejs');
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
