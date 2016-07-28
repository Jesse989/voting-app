var express = require("express");
var session = require("express-session");
var path = require("path");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var passport = require("passport");
var mongoose = require("mongoose");
require("./models/models");

//require routes
var api = require('./routes/api');
var index = require('./routes/index');
var authenticate = require('./routes/authenticate')(passport);

//connect to the database
mongoose.connect('mongodb://'+process.env.USER+':'+process.env.PW+'@ds011735.mlab.com:11735/ecommerce');

//express as the server
var app = express();

//assign a view engine and assign a view so there are no express errors
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//logger and session
app.use(logger('dev'));
app.use(session({
    secret: 'rusty nails'
}));

//initialize passport
var initPassport = require('./passport-init');
initPassport(passport);

//receive encoded body info from client
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

//serve the angular front end
app.use(express.static(__dirname + '/public'));

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

//declare which routes to use
app.use('/api', api);
app.use('/', index);
app.use('/auth', authenticate);


//assign port to either 3000, or the env port if there is one
var port = (process.env.PORT || 3000);

//start server
app.listen(port, function(){
    console.log("I'm waiting on port "+port+"...");
});



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
