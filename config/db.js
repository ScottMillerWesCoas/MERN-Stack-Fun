const mongoose = require('mongoose');
//using config npm package to store universal CONSTs
const config = require('config');
const dbLink = config.get('mongoURI'); //
//the below returns a promise.  You could .then, but asnyc await is cleaner and new standard

const connectDB = async () => {
	try {
		//pass the params below so you don't see MongoDB warnings in console
		const connect = await mongoose.connect(dbLink, {
			useNewUrlParser: true,
			useCreateIndex: true,
			useFindAndModify: false
		});
		console.log('MongoDB connected');
	} catch (err) {
		console.error('ERR', err.message);
		//exit process with failure
		//why 1?
		process.exit(1);
	}
};

module.exports = connectDB;
