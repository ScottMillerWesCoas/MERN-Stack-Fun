import React, { Fragment, useState } from 'react';
import { Link, Redirect } from 'react-router-dom';
//import axios from 'axios';
import { connect } from 'react-redux';
import { setAlert } from '../../actions/alert';
import { register } from '../../actions/auth';
import PropTypes from 'prop-types';

//destructuring props here and only using setAlert within it
const Register = ({ setAlert, register, isAuthenticated }) => {
	//webhooks
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		password2: ''
	});

	const { name, email, password, password2 } = formData;

	const onChange = e => {
		//setFormData same as setState
		//use brackets around e.target.name to dynamically set as key
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const onSubmit = async e => {
		e.preventDefault();
		if (password !== password2) {
			setAlert('Passwords do not match', 'danger', 3000);
		} else {
			register({ name, email, password });
			/*
			Below is an example request that will be put into a redux action
			const newUser = {
				name,
				email,
				password
			};
			try {
				//must send headers obj when sending to back end
				const config = {
					headers: {
						'Content-Type': 'application/json'
					}
				};
				const body = JSON.stringify(newUser);
				//use res re response from axios.post
				//must JSON stringify to send to back end, send config with headers obj inside as 3rd arg
				const res = await axios.post('/api/users', body, config);
				console.log(res.data);
			} catch (err) {
				//error message in err.response.data
				console.error(err.response.data);
			}
			*/
		}
	};

	//Redirect if logged in
	if (isAuthenticated) {
		return <Redirect to="/dashboard" />;
	}

	return (
		<Fragment>
			<h1 className="large text-primary">Sign Up</h1>
			<p className="lead">
				<i className="fas fa-user"></i> Create Your Account
			</p>
			<form className="form" onSubmit={e => onSubmit(e)}>
				<div className="form-group">
					<input type="text" placeholder="Name" name="name" value={name} onChange={e => onChange(e)} />
				</div>
				<div className="form-group">
					<input
						type="email"
						placeholder="Email Address"
						name="email"
						value={email}
						onChange={e => onChange(e)}
					/>
					<small className="form-text">
						This site uses Gravatar so if you want a profile image, use a Gravatar email
					</small>
				</div>
				<div className="form-group">
					<input
						type="password"
						placeholder="Password"
						name="password"
						value={password}
						onChange={e => onChange(e)}
					/>
				</div>
				<div className="form-group">
					<input
						type="password"
						placeholder="Confirm Password"
						name="password2"
						minLength="6"
						value={password2}
						onChange={e => onChange(e)}
					/>
				</div>
				<input type="submit" className="btn btn-primary" value="Register" />
			</form>
			<p className="my-1">
				Already have an account? <Link to="/login">Sign In</Link>
			</p>
		</Fragment>
	);
};

Register.propTypes = {
	setAlert: PropTypes.func.isRequired,
	register: PropTypes.func.isRequired,
	isAuthenticated: PropTypes.bool
};

const mapStateToProps = state => ({
	isAuthenticated: state.auth.isAuthenticated
});

//use connect to access redux, pass in state to use, then object with action in first (), in second () component
export default connect(
	mapStateToProps,
	{ setAlert, register }
)(Register);
