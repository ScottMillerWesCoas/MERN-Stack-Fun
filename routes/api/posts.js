const express = require('express');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Post = require('../../models/Posts');
const Profile = require('../../models/Profile');
const router = express.Router();

//@route		GET api/POSTS
//@desc			Get all posts
//@access		Public
router.get('/', async (req, res) => {
	try {
		//Sort by date from most recent first
		const posts = await Post.find({}).sort({ date: -1 });
		if (!posts) return res.status(404).json({ message: 'no posts exist' });
		res.json(posts);
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
});

//@route		GET api/POSTS/me
//@desc			Get all posts from current user
//@access		Private
router.delete('/:post_id', auth, async (req, res) => {
	const postId = req.params.post_id;
	if (!postId) {
		return res.status(422).json({ message: 'No post id provided' });
	} else {
		try {
			const post = await Post.findOneAndRemove({ _id: postId });
			return res.json({ message: 'Post successfully deleted' });
		} catch (err) {
			if (err.Kind === 'ObjectId') {
				return res.status(404).json({ message: 'post not found' });
			}
			return res.status(400).json({ message: err.message });
		}
	}
});

//@route		GET api/POSTS/me
//@desc			Get all posts from current user
//@access		Private
router.get('/me', auth, async (req, res) => {
	try {
		const posts = await Post.find({ user: req.user.id });
		if (!posts) {
			return res.status(404).json({ message: 'you have not posted anything' });
		} else {
			res.json(posts);
		}
	} catch (err) {
		return res.status(400).json({ message: err.message });
	}
});

router.get('/:post_id', auth, async (req, res) => {
	const postId = req.params.post_id;
	if (!postId) {
		return res.status(422).json({ message: 'invalid post id' });
	} else {
		try {
			const post = await Post.findById(postId);
			res.json(post);
		} catch (err) {
			if (err.kind === 'ObjectId') return res.status(422).json({ message: 'invalid post id' });
			return res.status(400).json({ message: err.message });
		}
	}
});

//@route		POST api/POSTS
//@desc			Post a new POST route
//@access		Private
router.post(
	'/me',
	[
		auth,
		[
			check('text', 'text is required')
				.not()
				.isEmpty()
		]
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ message: errors.array() });
		} else {
			try {
				const user = await User.findById(req.user.id).select('-password');
				//alt method
				//const user = await User.findOne({ _id: req.user.id });
				const { text } = req.body;
				const newPost = {};
				newPost.user = req.user.id;
				newPost.text = text;
				newPost.name = user.name;
				newPost.avatar = user.avatar;
				//date if automatic in model, no need
				//newPost.date = date;
				const post = new Post(newPost);
				await post.save();
				res.json(post);
			} catch (err) {
				return res.status(400).json({ message: err.message });
			}
		}
	}
);

//@route		PUT api/posts/like/:post_id
//@desc			Modifying a Post to have a user like it
//@access		Private
router.put('/like/:post_id', auth, async (req, res) => {
	const postId = req.params.post_id;
	if (!postId) {
		return res.status(422).json({ message: 'post not found' });
	} else {
		try {
			//const post = await Post.findOne({ _id: postId });
			//use mongoose findById instead
			const post = await Post.findById(postId);

			if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
				return res.status(400).json({ message: 'user already liked this post' });
			} else {
				post.likes.unshift({ user: req.user.id });
				await post.save();
				res.json(post.likes);
			}

			//when using mongooseSchema.findOne({_id: req.user.id});
			//when simply using array.find method, use .id instsead of _id
			const doesLike = post.likes.find(like => like.id === req.user.id);

			// if (!doesLike) {
			// 	post.likes.unshift({ _id: req.user.id });
			// 	await post.save();
			// 	return res.json({
			// 		message: 'successfully liked post',
			// 		doesLike: doesLike,
			// 		data: req.user.id,
			// 		likes: post.likes
			// 	});
			// } else {
			// 	const foundIndex = post.likes.findIndex(user => user === req.user.id);
			// 	post.likes.splice(foundIndex, 1);
			// 	await post.save();
			// 	return res.json({ message: 'successfully unliked post' });
			// }
		} catch (err) {
			return res.status(400).json({ message: err.message });
		}
	}
});

router.put('/unlike/:post_id', auth, async (req, res) => {
	const postId = req.params.post_id;
	if (!postId) {
		return res.status(422).json({ message: 'post not found' });
	} else {
		try {
			//const post = await Post.findOne({ _id: postId });
			//use mongoose findById instead
			const post = await Post.findById(postId);

			if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
				return res.status(400).json({ message: 'user has not liked this post' });
			} else {
				const likeIndex = post.likes.findIndex(like => like.user.toString() === req.user.id);
				post.likes.splice(likeIndex, 1);
				await post.save();
				res.json(post.likes);
			}

			//when using mongooseSchema.findOne({_id: req.user.id});
			//when simply using array.find method, use .id instsead of _id
			const doesLike = post.likes.find(like => like.id === req.user.id);

			// if (!doesLike) {
			// 	post.likes.unshift({ _id: req.user.id });
			// 	await post.save();
			// 	return res.json({
			// 		message: 'successfully liked post',
			// 		doesLike: doesLike,
			// 		data: req.user.id,
			// 		likes: post.likes
			// 	});
			// } else {
			// 	const foundIndex = post.likes.findIndex(user => user === req.user.id);
			// 	post.likes.splice(foundIndex, 1);
			// 	await post.save();
			// 	return res.json({ message: 'successfully unliked post' });
			// }
		} catch (err) {
			return res.status(400).json({ message: err.message });
		}
	}
});

//@route		POST api/posts/comment/:post_id
//@desc			Modifying a Post to have a user comment on it
//@access		Private
router.post(
	'/comment/:post_id',
	[
		auth,
		check('text', 'text is required')
			.not()
			.isEmpty()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ message: errors.array() });
		}
		const postId = req.params.post_id;
		if (!postId) {
			return res.status(400).json({ message: 'post does not exist' });
		} else {
			const { text } = req.body;
			try {
				const post = await Post.findById(postId);
				if (!post) {
					res.status(400).json({ message: 'post not found' });
				} else {
					const user = await User.findById(req.user.id).select('-password');
					const comment = {
						user: req.user.id,
						name: user.name,
						avatar: user.avatar,
						text: text
					};
					post.comments.unshift(comment);
					await post.save();
					res.json(post.comments);
				}
			} catch (err) {
				return res.status(400).json({ message: err.message });
			}
		}
	}
);

//@route		DELELTE api/posts/comment/:post_id
//@desc			deleting a comment on a post
//@access		Private
router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
	const postId = req.params.post_id;
	const commentId = req.params.comment_id;
	if (!postId) {
		return res.status(400).json({ message: 'no post submitted' });
	} else if (!commentId) {
		return res.status(400).json({ message: 'no comment submitted for deletion' });
	} else {
		try {
			const post = await Post.findById(postId);
			if (!post) {
				res.status(404).json({ message: 'post not found' });
			} else {
				const commentIndex = post.comments.findIndex(comment => comment.id.toString() === commentId);
				if (commentIndex) {
					if (post.comments[commentIndex].user.toString() != req.user.id) {
						return res.status(401).json({ message: 'user not authorized to delete this comment' });
					}
					post.comments.splice(commentIndex, 1);
					await post.save();
					res.json(post.comments);
				} else {
					res.status(400).json({ message: 'comment not found on post' });
				}
			}
		} catch (err) {
			return res.status(400).json({ message: err.message });
		}
	}
});

module.exports = router;
