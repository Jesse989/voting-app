var express = require('express');
var router = express.Router();
var mongoose = require( 'mongoose' );
var Poll = mongoose.model('Poll');
var sanitize = require("mongo-sanitize");
//Used for routes that must be authenticated.
function isAuthenticated (req, res, next) {
    // if user is authenticated in the session, call the next() to call the next request handler
    // Passport adds this method to request object. A middleware is allowed to add properties to
    // request and response objects

    //allow all get request methods
    if(req.method === "GET" || req.method === "PUT"){
        return next();
    }
    if (req.isAuthenticated()){
        return next();
    }

    // if the user is not authenticated then redirect him to the login page
    return res.redirect('/#login');
};

//Register the authentication middleware
router.use('/', isAuthenticated);

var getClientAddress = function (req) {
        return (req.headers['x-forwarded-for'] || '').split(',')[0] 
        || req.connection.remoteAddress;
};


router.route('/ip')
    .get(function(req, res) {
        var ip = getClientAddress(req);
        return res.send(200,ip);
    });
    
    
router.route('/polls')
//creates a new post
    .post(function(req, res){

        var poll = new Poll();
        poll.title = sanitize(req.body.title);
        poll.choices = sanitize(req.body.choices);
        poll.votes = req.body.votes;
        poll.created_by = req.body.created_by;
        poll.con = req.body.con;
    
        poll.save(function(err, post) {
            if (err){
                return res.status(500).send(err);
            }
            return res.redirect('/');
        });
    })
    //gets all posts
    .get(function(req, res){
        Poll.find(function(err, posts){
            if(err){
                return res.send(500, err);
            }
            return res.send(200,posts);
        });
    });

//post-specific commands. likely won't be used
router.route('/polls/:id')
//gets specified post
    .get(function(req, res){
        Poll.findById(req.params.id, function(err, poll){
            if(err)
                return res.send(err);
            return res.json(poll);
        });
    })
    //updates specified post
    .put(function(req, res){
        Poll.findById(req.params.id, function(err, poll){
            if(err)
                return res.send(err);
                poll.choices = sanitize(req.body.choices);
                poll.votes = req.body.votes;
                poll.con = req.body.con;
        
            poll.save(function(err, poll){
                if(err)
                   return  res.send(err);

                return res.json(poll);
            });
        });
    })
    //deletes the post
    .delete(function(req, res) {
        Poll.remove({
            _id: req.params.id
        }, function(err) {
            if (err)
                return res.send(err);
            res.json("deleted :(");
        });
    });

module.exports = router;