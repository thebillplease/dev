// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');
var bodyParser = require('body-parser');
var app        = express();
var morgan     = require('morgan');
var mongoose   = require('mongoose');

var jwt    	   = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config 	   = require('./config'); // get our config file
var User   	   = require('./app/models/user'); // get our mongoose user model
var Sensor     = require('./app/models/sensor');
// configure app
app.use(morgan('dev')); // log requests to the console

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port     = process.env.PORT || 8085; // set our port

mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

// create our router
var router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
	// do logging
	console.log('Something is happening.');
	next();
});


// =================================================================
// DUMMY USER CREATION ==========================================================
// =================================================================
	

// route (http://localhost:8085/v1/users)

router.route('/users')
	// POST 
	.post(function(req, res) {
		
		var user = new User();		// create a new instance of the Sensor model
		user.name = req.body.name;  // set the user name
        user.password = req.body.password;  // set the password 
        user.admin = req.body.admin;  // set if admin
       
		user.save(function(err) {
			console.log(user.name)
			if (err)
				res.send(err);

			res.json({ 
				success: true,
				message: 'User was saved successfully' });
		});
	})


// test route to make sure everything is working (accessed at GET http://localhost:8085/v1/)
router.get('/', function(req, res) {
	res.json({ message: 'Hi! I\'m an API. Talk to me!' });	
});

// http://localhost:8085/v1/authenticate pass name:password as key:value ...How secure is that?
//eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1NTcwZWQ5ZThjZjcyOGU5NjkwMDAwMDEiLCJuYW1lIjoiYmlsbCIsInBhc3N3b3JkIjoicGFzc3dvcmQiLCJhZG1pbiI6dHJ1ZSwiX192IjowfQ.MFhvud8ej0EOgCs5wLU2R8KDzbt5QQtpcnYUQOIyakM

router.route('/authenticate')

	.post(function(req, res){
		// find the user
		User.findOne({
			name: req.body.name
		}, function(err, user) {
	
			if (err) throw err;
	
			if (!user) {
				res.json({ success: false, message: 'Authentication failed. User not found.' });
			} else if (user) {
	
				// check if password matches
				if (user.password != req.body.password) {
					res.json({ success: false, message: 'Authentication failed. Wrong password.' });
				} else {
	
					// if user is found and password is right
					// create a token
					var token = jwt.sign(user, app.get('superSecret'), {
						// never expires
						// expiresInMinutes: 1440 // expires in 24 hours
					});
	
					res.json({
						success: true,
						message: 'You\'ve got a token!',
						token: token
					});
				}		
	
			}
	
		});

	});

// ---------------------------------------------------------
// MIDDLEWARE AND CHECK TOKEN
// ---------------------------------------------------------

router.use(function(req, res, next) {

	// check header or url parameters or post parameters for token
	var token = req.body.token || req.param('token') || req.headers['x-access-token'];

	// decode token
	if (token) {

		// verifies secret and checks exp
		jwt.verify(token, app.get('superSecret'), function(err, decoded) {			
			if (err) {
				return res.json({ success: false, message: 'Failed to authenticate token.' });		
			} else {
				// if everything is good, save to request for use in other routes
				req.decoded = decoded;	
				next();
			}
		});

	} else {

		// if there is no token
		// return an error
		return res.status(403).send({ 
			success: false, 
			message: 'Sorry, no token provided.'
		});
		
	}
	
});

// ---------------------------------------------------------
// AUTHENTICATED ROUTES
// ---------------------------------------------------------

// http://localhost:8085/v1/sensors

router.route('/sensors')

	// POST 
	.post(function(req, res) {
		
		var sensor = new Sensor();		// create a new instance of the Sensor model
		sensor.tid = req.body.tid;  // set the transmitter id
        sensor.sid = req.body.sid;  // set the sensor id 
        sensor.cat = req.body.cat;  // set the category value
        sensor.tmp = req.body.tmp;  // set the temperature
        sensor.vcc1 = req.body.vcc1;  // set the vcc before sending
        sensor.vcc2 = req.body.vcc2;  // set the vcc after sending
        sensor.seq = req.body.seq;  // set the sequence number for transmission error checking
        sensor.s = req.body.s;  // set the status on/off 1/0 

		sensor.save(function(err) {
			console.log(sensor.tid)
			if (err)
				res.send(err);

			res.json({ message: 'Sensor updated or created!' });
		});
	})

	// GET
	.get(function(req, res) {
		Sensor.find(function(err, sensors) {
			if (err)
				res.send(err);

			res.json(sensors);
		});
	});


// http://localhost:8085/v1/sensors/:sensor_id

router.route('/sensors/:sensor_id')

	// get the sensor with that id
	.get(function(req, res) {
		Sensor.findById(req.params.sensor_id, function(err, sensor) {
			if (err)
				res.send(err);
			res.json(sensor);
		});
	})

	// update the sensor with this id
	.put(function(req, res) {
		Sensor.findById(req.params.sensor_id, function(err, sensor) {

			if (err)
				res.send(err);
				sensor.tid = req.body.tid;  // set the transmitter id
				sensor.sid = req.body.sid;  // set the sensor id 
				sensor.cat = req.body.cat;  // set the category value
				sensor.tmp = req.body.tmp;  // set the temperature
				sensor.vcc1 = req.body.vcc1;  // set the vcc before sending
				sensor.vcc2 = req.body.vcc2;  // set the vcc after sending
				sensor.seq = req.body.seq;  // set the sequence number for transmission error checking
				sensor.s = req.body.s;  // set the status on/off 1/0 
				sensor.save(function(err) {
				if (err)
					res.send(err);

				res.json({ message: 'Your sensor has been updated!' });
			});

		});
	})

	// delete a sensor record with this id
	.delete(function(req, res) {
		Sensor.remove({
			_id: req.params.sensor_id
		}, function(err, sensor) {
			if (err)
				res.send(err);

			res.json({ message: 'Successfully deleted' });
		});
	});

// http://localhost:8085/v1/users

router.route('/users')
	.get(function(req, res){
		User.find(function(err, users) {
			if (err)
				res.send(err);

			res.json(users);
		});
		
	})
	
// http://localhost:8085/v1/sensors/:sensor_id

router.route('/users/:user_id')
	// update the user with this id
	.put(function(req, res) {
		User.findById(req.params.user_id, function(err, user) {

			if (err)
				res.send(err);
				user.name = req.body.name;  // set the user name
				user.password = req.body.password;  // set the password 
				user.admin = req.body.admin;  // set if admin
				user.save(function(err) {
				if (err)
					res.send(err);

				res.json({ message: 'Your user has been updated!' });
			});

		});
	})

	// delete a sensor record with this id
	.delete(function(req, res) {
		User.remove({
			_id: req.params.user_id
		}, function(err, user) {
			if (err)
				res.send(err);

			res.json({ message: 'Successfully deleted' });
		});
	});



// REGISTER OUR ROUTES -------------------------------
app.use('/v1', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
