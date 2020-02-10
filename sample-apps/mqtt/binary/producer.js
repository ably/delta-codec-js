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
	const binaryData = {
		base: Uint8Array.from([76, 111, 114, 101, 109, 32, 105, 112, 115, 117, 109, 32, 100, 111, 108, 111, 114, 32, 115, 105, 116, 32, 97, 109, 101, 116]),
		delta: Uint8Array.from([214, 195, 196, 0, 0, 1, 26, 0, 40, 56, 0, 30, 4, 1, 44, 32, 99, 111, 110, 115, 101, 99, 116, 101, 116, 117, 114, 32, 97, 100, 105, 112, 105, 115, 99, 105, 110, 103, 32, 101, 108, 105, 116, 46, 19, 26, 1, 30, 0]),
		secondDelta: Uint8Array.from([214, 195, 196, 0, 0, 1, 56, 0, 69, 115, 0, 59, 4, 1, 32, 70, 117, 115, 99, 101, 32, 105, 100, 32, 110, 117, 108, 108, 97, 32, 108, 97, 99, 105, 110, 105, 97, 44, 32, 118, 111, 108, 117, 116, 112, 97, 116, 32, 111, 100, 105, 111, 32, 117, 116, 44, 32, 117, 108, 116, 114, 105, 99, 101, 115, 32, 108, 105, 103, 117, 108, 97, 46, 19, 56, 1, 59, 0]),
	}
	publish(binaryData.base);
	publish(binaryData.delta);
	publish(binaryData.secondDelta);
});

function publish(message) {
	client.publish(channelName, message, { qos: 0 }, (err) => {
		if(err) {
			console.log(err);
		}
	});
}
