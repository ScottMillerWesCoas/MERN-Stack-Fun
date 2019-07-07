const express = require('express');
//
const app = express();

const PORT = process.env.PORT || 5000;

const connectDB = require('./config/db.js');

//use to need to require body-parser, now included in express
//used to do app.use(bodyParser.json({extneded: false}))
app.use(express.json({ extended: false }));

//Define routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/auth', require('./routes/api/auth'));

app.get('/', (req, res, body) => {
	res.send('HIYA!');
});

app.listen(PORT, () => {
	console.log(`you're listening on port ${PORT}`);
});

connectDB();

module.exports = app;
