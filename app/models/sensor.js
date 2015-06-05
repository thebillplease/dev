var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var SensorSchema   = new Schema({
	tid: Number,
    sid: Number,
    cat: Number,
    tmp: Number,
    vcc1: Number,
    vcc2: Number,
    seq: Number,
    s: Number
});

module.exports = mongoose.model('Sensor', SensorSchema);