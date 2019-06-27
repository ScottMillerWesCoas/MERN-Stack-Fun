const express = require('express');

const app = express();

const PORT = process.env.PORT || 5000;

const connectDB = require('./config/db.js');

app.get('/', (req, res, body) => {
	res.send('HIYA!');
});

app.listen(PORT, () => {
	console.log(`you're listening on port ${PORT}`);
});

connectDB();

module.exports = app;
