var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var pollSchema = new mongoose.Schema({
    created_by: String,		
    created_at: {type: Date, default: Date.now},
    title: String,
    choices: [String],
    votes: [Number],
    con: [String]
});

var userSchema = new mongoose.Schema({
    username: String,
    password: String, //hash created from password
    created_at: {type: Date, default: Date.now}
});


mongoose.model('Poll', pollSchema);
mongoose.model('User', userSchema);