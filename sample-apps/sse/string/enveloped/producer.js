(() => {
	const client = new Ably.Realtime('API:KEY');
	const channel = client.channels.get('sample-app-sse');
	
	client.connection.on('connected', () => {
		const data = {
			foo: 'bar',
			count: 1,
			status: 'active'
		};
		channel.publish('data', data);
		data.count++;
		channel.publish('data', data);
		data.status = 'inactive';
		channel.publish('data', data);
	});
})();
