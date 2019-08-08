import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

//key in every list!
const Alert = ({ alerts }) => {
	const displayAlerts = alerts.length
		? alerts.map(al => {
				console.log(al);
				//must return out JSX in map
				return (
					<div key={al.id} className={`alert alert-${al.alertType}`}>
						{al.msg}
					</div>
				);
		  })
		: null;
	return displayAlerts;
};

Alert.propTypes = {
	alerts: PropTypes.array.isRequired
};

const mapStateToProps = state => ({
	alerts: state.alert
});

export default connect(mapStateToProps)(Alert);
