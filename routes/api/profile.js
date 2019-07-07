const express = require('express');
const router = express.Router();
//when posting data, always use express-validator
const { check, validationResult } = require('express-validator');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const config = require('config');
const secret = config.get('jwtSecret');
//Note: head to github/settings/developers and register app to be able to pull data
const auth = require('../../middleware/auth');
//for use in pulling user's repos from github
const request = require('request');
const githubClientId = config.get('githubClientId');
const githubClientSecret = config.get('githubClientSecret');

// @route		GET api/profile/me
//@desc			Get current user's profile
//@access		private
router.get('/me', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id }).populate('users', ['name', 'avatar']);
		if (!profile) {
			return res.status(400).json({ message: 'no profile for this user ' });
		} else {
			return res.json(profile);
		}
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ message: err.message });
	}
});

router.get('/', auth, async (req, res) => {
	try {
		const profiles = await Profile.find({}).populate('user', ['name', 'avatar']);
		if (!profiles) {
			return res.status(400).json({ message: 'no profiles exist ' });
		} else {
			return res.json(profiles);
		}
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ message: err.message });
	}
});

//@route		GET api/profile/user/:userId
//@desc			Get profile by ID
//@access		private
router.get('/user/:user_id', async (req, res) => {
	try {
		const id = req.params.user_id;
		if (!id) {
			return res.status(400).json({ message: req.params });
		} else {
			const profile = await Profile.findOne({ user: id });
			if (!profile) return res.status(422).json({ message: 'profile not found' });
			else return res.json(profile);
		}
	} catch (err) {
		if (err.kind === 'ObjectId') {
			return res.status(422).json({ message: 'profile not found' });
		}
		console.error(err.message);
		res.status(500).json({ message: err.message });
	}
});

// @route		POST api/users
//@desc			POST profile for user
//@access		Public
router.post(
	'/',
	[
		auth,
		check('status', 'status is required')
			.not()
			.isEmpty(),
		check('skills', 'skills are required')
			.not()
			.isEmpty()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ message: errors.array() });
		} else {
			const {
				company,
				website,
				location,
				status,
				skills,
				bio,
				githubusername,
				twitter,
				facebook,
				linkedin,
				instagram,
				youtube
			} = req.body;

			const profileFields = {};
			profileFields.social = {};

			//MUST INCLUDE BELOW TO connect this profile to the user
			profileFields.user = req.user.id;

			if (company) profileFields.company = company;
			if (website) profileFields.website = website;
			if (location) profileFields.location = location;
			if (status) profileFields.status = status;
			if (skills) profileFields['skills'] = skills.split(',').map(skill => skill.trim());
			if (bio) profileFields.bio = bio;
			if (githubusername) profileFields.githubusername = githubusername;

			if (twitter) profileFields.social.twitter = twitter;
			if (facebook) profileFields.social.facebook = facebook;
			if (linkedin) profileFields.social.linkedin = linkedin;
			if (instagram) profileFields.social.instagram = instagram;
			if (youtube) profileFields.social.youtube = youtube;

			try {
				let profile = await Profile.findOne({ user: req.user.id });
				if (profile) {
					//Update
					profile = await Profile.findOneAndUpdate(
						{ user: req.user.id },
						{ $set: profileFields },
						{ new: true }
					);
					return res.json(profile);
				}
				//Create
				profile = new Profile(profileFields);
				await profile.save();
				return res.json(profile);
			} catch (err) {
				console.error(err.message);
				res.status(400).json({ message: err.message });
			}
		}
	}
);

//@route		DELETE api/profile/user/:userId
//@desc			DELETE profile by ID
//@access		private
router.delete('/', auth, async (req, res) => {
	try {
		//remove profile
		//not going to get anything for later use, so no variable needed
		await Profile.findOneAndRemove({ user: req.user.id });

		//remove user
		await User.findOneAndRemove({ _id: req.user.id });
		return res.json({ message: 'User and profile removed' });
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ message: err.message });
	}
});

//@route		PUT api/profile
//@desc			Add new experience to profile
//@access		private
router.put(
	'/experience',
	[
		auth,
		[
			check('company', 'company is required')
				.not()
				.isEmpty(),
			check('title', 'title is required')
				.not()
				.isEmpty(),
			check('from', 'from date is required')
				.not()
				.isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ message: errors.array() });
		}
		const { title, company, location, from, to, current, description } = req.body;
		//don't need to check if they exist, cause can simply submit empty parts
		//below same as newExp = { title: title, etc };
		const newExp = {
			title,
			company,
			location,
			from,
			to,
			current,
			description
		};
		try {
			//first find profile
			let profile = await Profile.findOne({ user: req.user.id });
			//then update with newExp - it's an array to add to front with unshift
			profile.experience.unshift(newExp);
			await profile.save();
			return res.json(profile);
			//remove user
		} catch (err) {
			console.error(err.message);
			res.status(500).json({ message: err.message });
		}
	}
);

//@route		DELETE api/profile/experience
//@desc			Delete  experience from profile
//@access		private
router.delete('/experience/:experience_id', auth, async (req, res) => {
	const expId = req.params.experience_id;
	if (!expId) return res.status(400).json({ message: 'missing experience id' });
	try {
		const profile = await Profile.findOne({ user: req.user.id });

		//NOTE when looping through experience array we use .id, cause we're using mongoose,
		//not ._id
		const foundIndex = profile.experience.findIndex(exp => exp.id === expId);
		profile.experience.splice(foundIndex, 1);
		await profile.save();
		return res.json(profile);
	} catch (err) {
		return res.status(500).json({ message: 'server error' });
		console.error(err.message);
	}
});

//@route		PUT api/education
//@desc			Add new education to profile
//@access		private
router.put(
	'/education',
	[
		auth,
		[
			check('school', 'school is required')
				.not()
				.isEmpty(),
			check('from', 'from date is required')
				.not()
				.isEmpty(),
			check('degree', 'degree is required')
				.not()
				.isEmpty(),
			check('fieldofstudy', 'field of study is required')
				.not()
				.isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ message: errors.array() });
		} else {
			try {
				const { school, degree, fieldofstudy, from, to, current, description } = req.body;
				const newEd = { school, degree, fieldofstudy, from, to, current, description };
				const profile = await Profile.findOne({ user: req.user.id });
				profile.education.unshift(newEd);
				await profile.save();
				res.json({ profile });
			} catch (err) {
				return res.status(422).json({ message: err.message });
			}
		}
	}
);
//@route		DELETE api/education
//@desc			delete passed education item from profile
//@access		private
router.delete('/education/:education_id', auth, async (req, res) => {
	const edId = req.params.education_id;
	if (!edId) return res.status(422).json({ message: 'no education id provided' });
	try {
		const profile = await Profile.findOne({ user: req.user.id });
		//NOTE when looping through experience array we use .id, cause we're using mongoose,
		//not ._id
		const foundIndex = profile.education.findIndex(ed => ed.id === edId);
		profile.education.splice(foundIndex, 1);
		await profile.save();
		res.json(profile);
	} catch (err) {
		return res.status(422).json({ message: err.message });
	}
});

//@route		GET api/github
//@desc			get user's repos from github
//@access		Public//
router.get('/github/:username', async (req, res) => {
	const user = req.params.username;

	try {
		const options = {
			uri: `https://api.github.com/users/${user}/repos?per_page=5&sort=created:asc&client_id=${githubClientId}&client_secret=${githubClientSecret}`,
			method: 'GET',
			headers: { 'user-agent': 'node.js' }
		};
		request(options, (err, response, body) => {
			if (err) {
				console.log(err);
				return response.status(400).json({ message: 'error connecting to github' });
			}
			if (response.statusCode != 200) {
				return response.status(404).json({ message: 'no github profile found for this user' });
			}
			return res.json(JSON.parse(body));
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ message: err.message });
	}
});

module.exports = router;
