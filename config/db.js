const mongoose = require('mongoose');
const config = require('config');
const dbLink = config.get('mongoURI');

//the below returns a promise.  You could .then, but asnyc await is cleaner and new standard

const connectDB = async () => {
	try {
		const connect = await mongoose.connect(dbLink, { useNewUrlParser: true });
		console.log('MongoDB connected');
	} catch (err) {
		console.error('ERR', err.message);
		//exit process with failure
		process.exit(1);
	}
};

module.exports = connectDB;
