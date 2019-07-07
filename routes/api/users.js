const express = require('express');
const gravatar = require('gravatar');
const router = express.Router();
//note using bcrpytjs, not bcrypt
const bcrypt = require('bcryptjs');

//when posting data, always use express-validator
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const config = require('config');
const secret = config.get('jwtSecret');

//@route		POST api/users
//@desc			Test route
//@access		Public

//2nd param is middleware - array with check functions
router.post(
	'/',
	//step 1, use check imported from express-validator - see docs
	[
		check('email', 'valid email address is required').isEmail(),
		check('name', 'name is required')
			.not()
			.isEmpty(),
		check('password', 'please enter a password with 6 or more chars').isLength({ min: 6 })
	],
	//to use await on Mongoose User.findOne below, so no need for callback or .then,
	// add async before this function
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			//res.status(422) = bad request
			//then send with json the error using the express-validator built in method .array()
			return res.status(422).json({ erros: errors.array() });
		} else {
			const { name, email, password } = req.body;
			try {
				//short-cut, don't need to do User.findOne({ email: email } can just use email, when
				// const representing value is same name as key to search by
				let user = await User.findOne({ email });
				//with async/await, always use await wrapped in try{}catch(err){console.error(err.message)}
				//also, no need for callback now, await makes async code synchronous
				if (user) {
					//use res.status(400) when bad request
					//make error below match on client what above errors look like/format
					//return this to make sure it doesn't send response 2x
					return res.status(400).json({ errors: [{ message: 'User already exists' }] });
				} else {
					//pull pic - if exists, from gravatar
					const avatar = gravatar.url(email, {
						s: '200', //size - 200px
						r: 'pg', //rating - no adult content
						d: 'mm' //default user icon
					});

					//simply create the user, don't save yet, so just use new User({}), not User.create
					user = new User({
						name,
						email,
						password,
						avatar
					});

					//# passed into genSalt is the number of rounds of salting.  Higher # more secure but slower
					const salt = await bcrypt.genSalt(10);
					user.password = await bcrypt.hash(password, salt);

					//can simply use await if don't need to use promise anywhere else since catch will throw err
					await user.save();

					//then use JWT
					//check out https://jwt.io/introduction/ to learn more!
					//Note: Mongo (incl Mongo Atlas) creates _id which Mongoose uses to create the
					//abstraction .id so .id is available though it's not listed in Mongo Atlas in user

					const payload = {
						user: {
							id: user.id
						}
					};

					//not a promise, so can't use await, 3rd arg is params, 4th is callback
					jwt.sign(payload, secret, { expiresIn: 360000 }, (err, token) => {
						if (err) throw err;
						//res.json auto send status of 200
						res.json({ token });
					});

					//res.status(200).json({ user });
				}
				//see if user exists - if yes, send error

				//if not, check for user gravatar

				//if not, encrypt password with brcrypt

				//return jsonwebtoken
			} catch (err) {
				console.error(err.message);
				//use res.status(500) when can't connect
				res.status(500).send('Server error');
			}
		}
	}
);

module.exports = router;
