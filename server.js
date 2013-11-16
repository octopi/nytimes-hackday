var express = require('express'),
ig = require('instagram-node').instagram(),
async = require('async'),
request = require('request'),
_ = require('underscore');

var app = express();
app.use(express.logger());
app.use(express.bodyParser());

var getNYTimesTrending = function() {
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
      return facets;
    }
  });

  var addToFacets = function(url) {
    return function(facet) {
      facets[facet] = url;
    };
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
