const jwt = require('jsonwebtoken');
const config = require('config');
const secret = config.get('jwtSecret');

//this is middleware jwt check before protected route
// so we need to check the request, and also need
//access to the next param to confirm moving on
//to next step in routing/express process
const authCheck = (req, res, next) => {
	//get token from header
	const token = req.header('x-auth-token');

	//check if no token
	if (!token) {
		//401 means access denied
		res.status(401).json({ message: 'No token, authorization denied' });
	}
	try {
		//decode token
		const decoded = jwt.verify(token, secret);
		//take req obj and assign a value to user;
		req.user = decoded.user;
		//like all middleware on success, call next();
		next();
	} catch (err) {
		//access denied
		res.status(401).json({ message: 'token is not valid' });
	}

	//verify token
};

module.exports = authCheck;
