const mqtt = require('mqtt');

const options = {
	keepalive: 30,
	username: 'FIRST_HALF_OF_API_KEY',
	password: 'SECOND_HALF_OF_API_KEY',
	port: 8883
};
const client = mqtt.connect('mqtts:mqtt.ably.io', options);
const channelName = 'sample-app-mqtt';

client.on('connect', () => {
	const data = {
		foo: 'bar',
		count: 1,
		status: 'active'
	};
	publish(data);
	data.count++;
	publish(data);
	data.status = 'inactive';
	publish(data);
});

function publish(message) {
	client.publish(channelName, JSON.stringify(message), { qos: 0 }, (err) => {
		if(err) {
			console.log(err);
		}
	});
}
