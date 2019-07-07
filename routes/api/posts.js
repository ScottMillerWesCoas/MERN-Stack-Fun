const express = require('express');
router = express.Router();

// @route		GET api/users
//@desc			Test route
//@access		Public
router.get('/', (req, res) => res.send('posts route'));

module.exports = router;
