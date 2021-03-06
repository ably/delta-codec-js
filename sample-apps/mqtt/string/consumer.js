const mqtt = require('mqtt');
const { VcdiffDecoder } = require('../../../lib');

const options = {
	keepalive: 30,
	username: 'FIRST_HALF_OF_API_KEY',
	password: 'SECOND_HALF_OF_API_KEY',
	port: 8883
};
const client = mqtt.connect('mqtts:mqtt.ably.io', options);
const channelName = 'sample-app-mqtt';
const channelDecoder = new VcdiffDecoder();

client.on('message', (_, payload) => {
	let data = payload;

	try {
		if (VcdiffDecoder.isDelta(data)) {
			data = channelDecoder.applyDelta(data).asUtf8String();
		} else {
			channelDecoder.setBase(data);
		}
		data = JSON.parse(data);
	} catch(e) {
		/* Delta decoder error */
		console.log(e);
	}
	
	/* Process decoded data */
	console.log(data);
});

client.subscribe(`[?delta=vcdiff]${channelName}`);
