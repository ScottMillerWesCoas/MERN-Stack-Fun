const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const config = require('config');
//converted from secret to public/private key
//const secret = config.get('jwtSecret');
const jwtSign = require('../../middleware/jwtSign');

// @route		GET api/users
//@desc			Test route
//@access		Public

//used if either no email or wrong pwd - using diff msgs allows bad guys to see that
//the email they're using DOES exist in DB.  Bad move.
const invalidCredentials = res => res.status(400).json({ message: 'Invalid credentials' });

//can easily add middleware by adding it after url
router.get('/', auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('-password');
		res.status(200).json(user);
	} catch (err) {
		//server error
		res.status(500).json({ message: err.message });
	}
});

//POST request to API/auth
//Authenticate user and get token
//2nd param is middleware - array with check functions
router.post(
	'/',
	//step 1, use check imported from express-validator - see docs
	[check('email', 'valid email address is required').isEmail(), check('password', 'password is required').exists()],
	//to use await on Mongoose User.findOne below, so no need for callback or .then,
	// add async before this function
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			//res.status(422) = bad request
			//then send with json the error using the express-validator built in method .array()
			return res.status(422).json({ erros: errors.array() });
		} else {
			let { email, password } = req.body;
			try {
				//first check for user, then after check email
				const user = await User.findOne({ email });
				//short-cut, don't need to do User.findOne({ email: email } can just use email, when
				// const representing value is same name as key to search by

				//with async/await, always use await wrapped in try{}catch(err){console.error(err.message)}
				//also, no need for callback now, await makes async code synchronous
				if (!user) {
					//use res.status(400) when bad request
					//make error below match on client what above errors look like/format
					//return this to make sure it doesn't send response 2x
					invalidCredentials(res);
				} else {
					//now that we see login email matches an email in the DB,
					//we can use built-in bcrypt.compare to check user entered
					//pwd against existing (hashed/salted) pwd in database
					const isMatch = await bcrypt.compare(password, user.password);

					if (!isMatch) {
						invalidCredentials(res);
					}
					//then use JWT
					//check out https://jwt.io/introduction/ to learn more!
					//Note: Mongo (incl Mongo Atlas) creates _id which Mongoose uses to create the
					//abstraction .id so .id is available though it's not listed in Mongo Atlas in user

					const payload = {
						user: {
							id: user.id
						}
					};

					jwtSign(payload, res);
				}
			} catch (err) {
				console.error(err.message);
				//use res.status(500) when can't connect
				res.status(500).send(err.message);
			}
		}
	}
);

module.exports = router;
