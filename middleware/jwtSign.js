const jwt = require('jsonwebtoken');
const fs = require('fs');
const privateKey = fs.readFileSync(__dirname + '/privateKey/private.key', 'utf-8');
const i = 'DevelopedByScottMiller'; // Issuer
const a = 'http://localhost:3002'; // Audience
const signOptions = {
	issuer: i,
	audience: a,
	expiresIn: '72hr',
	algorithm: 'RS512'
};
const sign = (payload, res) => {
	jwt.sign(payload, privateKey, signOptions, (err, token) => {
		if (err) throw err;
		else res.json({ message: 'submitted authentication using private key', token: token });
	});
};

module.exports = sign;
