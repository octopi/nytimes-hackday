var express = require('express'),
ig = require('instagram-node').instagram(),
async = require('async'),
request = require('request');

var app = express();
app.use(express.logger());
app.use(express.bodyParser());

var getNYTimesTrending = function() {

  return {
    'USA': 'http://nytimes.com/url',
    'thanksgiving': 'http://nytimes.com/url'
  };
};
var pullFromTwitter = function() {
  console.log('yo');
};
var makeComment = function(instagramUrl) {};

pullFromTwitter();

app.get('/', function(req, res) {
});


var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
