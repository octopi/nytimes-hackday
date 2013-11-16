var express = require('express'),
ig = require('instagram-node').instagram(),
async = require('async');

var app = express();
app.use(express.logger());
app.use(express.bodyParser());

app.get('/', function(req, res) {
  res.send('whaddup');
});


var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
