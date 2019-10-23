# JavaScript Codec Library for the VCDIFF Delta Format

## Overview

This repository contains an java implementation of the [VCDiff Application Library](https://github.com/ably/wiki/issues/380#issuecomment-533647591) that provides functionality for applying `vcdiff` deltas/patches. The  [VCDiff Application Library](https://github.com/ably/wiki/issues/380#issuecomment-533647591) facilitates applying `vcdiff` deltas/patches employing the codec pattern. `vcdiff` is a [format for representing deltas](https://tools.ietf.org/html/rfc3284) - differences between data sets (be it files, messages, etc.) 

## Supported platforms

The library is ES6 compliant. It supports the following platforms:

**Browsers:** All major desktop and mobile browsers, including (but not limited to) Chrome, Firefox, IE (only version 10 or newer), Safari on iOS and macOS, Opera, and Android browsers.

**Webpack:** see [using Webpack in browsers](#using-webpack), or [our guide for serverside Webpack](#serverside-usage-with-webpack)

**Node.js:** version 8 or newer

**TypeScript:** see [below](#typescript)


We regression-test the library against a selection of those (which will change over time, but usually consists of the versions that are supported upstream, plus old versions of IE).


## General Use

The `VcdiffDecoder` class is the entry point to the public API. It provides a stateful and stateless way of applying `vcdiff` deltas.

`VcdiffDecoder` can do the necessary bookkeeping in the scenario where a number of successive deltas/patches have to be applied where each of them represents the difference to the previous one (e.g. a sequence of messages each of which represents a set of mutations to a given JavaScript object; i.e. sending only the mutations of an object instead the full object each time).

In order to benefit from the bookkepping provided by the `VcdiffDecoder` class one has to first provide the base object that the first delta would be generated against (e.g. the full JavaScript object from teh example above). That could be done using the `setBase` method.

```
let codec = new VcdiffDecoder();
codec.setBase(baseObject /*the base object/message*/, 
              message.id /*any unique identifier of the mesage there might be*/, 
              false/*is the message base64 encoded*/);
```

Once the codec is initialized like this a stream of deltas/patches could be applied each one resulting in a new full message.

```
let result = codec.applyDelta(vcdiffDelta, 
                deltaID,/*any unique identifier of the resulting object there might be*/ 
                baseID,/*any unique identifier of the object this delta was generated against there might be */
                false/*is the message base64 encoded*/);
```

`applyDelta` could be called as many times as needed. The `VcdiffDecoder` will automatically retain the last delta application result and use it as a base for the next delta application (it will also check whether the uniqie ids of the deltas, if any, match). Thus it allows applying an inifinte sequence of deltas.

`result` would be of type `DeltaApplicationResult`. That is a convenience class that allows interpreting the result in various data formats - string, array, etc.

## Common Use Cases

### MQTT

```
var client = mqtt.connect(<url>, <options>);
var textDecoder = new encoding.TextDecoder();
var channelDecoder = new DeltaCodec.VcdiffDecoder();
client.on('message', function (topic, payload) {
	var message = textDecoder.decode(payload);
	var data = message;
	try {
		if (DeltaCodec.VcdiffDecoder.isDelta(message, true)) {
			data = channelDecoder.applyDelta(message, undefined, undefined, true).asUtf8String();
		} else {
			channelDecoder.setBase(message);
		}
	} catch(e) {
		/* Delta decoder error */
	}
	
	/* Process decoded data */
	console.log(data);
});
```

### SSE

```
var eventSource = new EventSource(<url>);
var channelDecoder = new DeltaCodec.VcdiffDecoder();
eventSource.onmessage = function(event) {
	var message = JSON.parse(event.data);
	var data = message.data;
	try {
		if (DeltaCodec.VcdiffDecoder.isDelta(data, true)) {
			data = channelDecoder.applyDelta(data, undefined, undefined, true).asUtf8String();
		} else {
			channelDecoder.setBase(data);
		}
	} catch(e) {
		/* Delta decoder error */
	}

	/* Process decoded data */
	console.log(data);
};
```

## Support, feedback and troubleshooting

Please visit http://support.ably.io/ for access to our knowledgebase and to ask for any assistance.

You can also view the [community reported Github issues](https://github.com/ably/ably-js/issues).

To see what has changed in recent versions, see the [CHANGELOG](CHANGELOG.md).

## Contributing

1. Fork it
2. Make sure you have installed the right version of Node (see the `.nvmrc` file to find the version of Node required to develop this project)
3. Create your feature branch (`git checkout -b my-new-feature`)
4. Commit your changes (`git commit -am 'Add some feature'`)
5. Ensure you have added suitable tests and the test suite is passing(`grunt test`)
6. Ensure the [type definitions](https://github.com/ably/delta-codec-js/blob/master/ably.d.ts) have been updated if the public API has changed
7. Ensure you stick to the version of JS used by the library (currently ES6). 
8. Push to the branch (`git push origin my-new-feature`)
9. Create a new Pull Request

## Release Process

- Make sure the tests are passing in ci for the branch you're building
- Update the CHANGELOG.md with any customer-affecting changes since the last release

## License

Copyright (c) 2019 Ably Real-time Ltd, Licensed under the Apache License, Version 2.0.  Refer to [LICENSE](LICENSE) for the license terms.
