# Vcdiff Codec Library for JavaScript

[![Build Status](https://travis-ci.org/ably/delta-codec-js.svg?branch=master)](https://travis-ci.org/ably/delta-codec-js)
[![npm version](https://badge.fury.io/js/%40ably%2Fdelta-codec.svg)](https://badge.fury.io/js/%40ably%2Fvcdiff-decoder)

A Vcdiff codec library supporting the Vcdiff delta format, as defined by
[RFC 3284](https://tools.ietf.org/html/rfc3284).
This library supports developers who need to consume delta streams from Ably without using the official JavaScript client library (e.g. for
[MQTT](https://www.ably.io/concepts/mqtt)
and
[SSE](https://www.ably.io/concepts/server-sent-events)
applications).

Throughout this documentation, and within the code itself, we refer to a Vcdiff payload as a 'delta'.
Elsewhere such delta payloads may be referred to as patches or diffs, but for consistency within this repository we stick to the terms 'delta' and 'deltas'.

## Installation from npm for Node.js

    npm install @ably/delta-codec

and require as:

```js
var deltaCodec = require('@ably/delta-codec');
```

## Script include for Web Browsers

Include the library in your HTML from our CDN:

```html
<script src="https://cdn.ably.io/lib/delta-codec.min-1.js"></script>
```

We follow [Semantic Versioning](http://semver.org/). To lock into a major or minor version of the client library, you can specify a specific version number - for example:

* `https://cdn.ably.io/lib/delta-codec.min-1.js` for latest `1.*` version
* `https://cdn.ably.io/lib/delta-codec.min-1.0.js` for latest `v1.0.*` version
* `https://cdn.ably.io/lib/delta-codec.min-1.0.2.js` for version `1.0.2` explicitly

You can load the non-minified version by omitting `min-` from the URL, for example `https://cdn.ably.io/lib/delta-codec-1.js`.

See [tagged releases](https://github.com/ably/delta-codec-js/releases) for available versions.

## Basic Stream Decoder

The `VcdiffDecoder` constructor provides the most basic entry point to the public API. It provides a stateful way of applying a stream of Vcdiff deltas, producing a new value after each delta has been applied to the previous value.

First provide the base value, upon which the first delta will be applied using the 'setBase' method:

```js
let decoder = new deltaCodec.VcdiffDecoder();
decoder.setBase(value);
```

Once the decoder has been initialized like this, then each subsequent delta is applied using the `applyDelta` method:

```js
let result = decoder.applyDelta(delta);
// TODO call method on result to get the value format you require
```

The `decoder` retains the current value, with the result of this method encapsulating that new value now that `delta` has been applied to the previous value.
The `result` of this method offers methods to allow you to access the new current value in the format you require:

- `asUint8Array()`: a `Uint8Array`, being the new current value, as received (i.e. 'raw' bytes)
- `asUtf8String()`: a `string`, decoded from data using UTF-8
- `asObject()`: a JavaScript object, decoded from data using `JSON.parse`

### `setBase(value)` Instance Method

Accepts a single `value` argument, the 'base', which may be `ArrayBuffer`, `Uint8Array`, `Buffer` or `string`.
If a `string` is supplied then it will be UTF-8 encoded by the library before being stored as the current value.
This is freeform data, as specified by the application.

The decoder also exposes an alternative method, `setBase64Base(value)`, where the single `value` argument must be `string` and is Base64 decoded by the library before being stored as the current value.

### `applyDelta(delta)` Instance Method

Accepts a single `delta` argument which may be `ArrayBuffer`, `Uint8Array` or `Buffer`.
This is a Vcdiff format delta.

The decoder also exposes an alternative method, `applyBase64Delta(delta)`, where the single `delta` argument must be `string` and is Base64 decoded by the library before being applied as a Vcdiff format delta to the current value.

### `isDelta(data)` Static Method

Accepts a single `data` argument which may be `ArrayBuffer`, `Uint8Array` or `Buffer`.
Returns `true` only if `data` has a Vcdiff delta header.

This method can be used on receipt of a binary payload to detect whether it should be interpreted as an absolute value or as a delta to be applied to the previous value.
Such 'sniffing' should be avoided where there is metadata available alongside received payloads to indicate whether they are deltas or not, as is the case when receiving a stream of enveloped data from Ably over SSE (see example).

## Checked Stream Decoder

The `CheckedVcdiffDecoder` is a variant of `VcdiffDecoder` that can be used when the values and the deltas applied to them have unique identifiers. The 'set' and 'apply' methods on the checked decoder have the same names but require additional arguments for these identifiers:

- `applyDelta(delta, deltaId, baseId)`
- `applyBase64Delta(delta, deltaId, baseId)`
- `setBase(value, baseId)`
- `setBase64Base(value, baseId)`

The `baseId` argument supplied to the 'set' methods and the `deltaId` arguments supplied to the 'apply' methods are stored alongside the current value and then compared to the `baseId` argument supplied in subsequent 'apply' calls.
An `Error` is thrown if there is a mismatch.

## Example Use Cases

### Node.js: Text stream from Ably via SSE (enveloped)

By default the event data received from Ably is enveloped in JSON format.
We decode this data and inspect the Ably formatted message contents in order to establish whether the data in this message is an absolute value or a delta to be applied to the previously received value.

```js
const deltaCodec = require('@ably/delta-codec');
const EventSource = require('eventsource');

const prefix = '[?delta=vcdiff]';
const url = `https://realtime.ably.io/event-stream?channels=${prefix}${CHANNEL_NAME}&v=1.2&key=${APP_KEY}`;
const eventSource = new EventSource(url);
const decoder = new deltaCodec.CheckedVcdiffDecoder();
eventSource.onmessage = function onEventSourceMessage(event) {
  const message = JSON.parse(event.data);
  let value;
  const deltaExtras = (message.extras && message.extras.delta) ? message.extras.delta : null;
  if (deltaExtras) {
    if (deltaExtras.format !== 'vcdiff') {
      throw new Error(`Delta format ${deltaExtras.format} not understood.`);
    }
    value = decoder.applyBase64Delta(message.data, message.id, deltaExtras.from).asUtf8String();
  } else {
    value = message.data;
    decoder.setBase(value, message.id);
  }
  console.log(`received: ${value}`);
};
eventSource.onerror = function onEventSourceError(event) {
  console.log(`error: ${event.data}`);
};
```

### Node.js: Text stream from Ably via SSE (not enveloped)

For this example we have subscribed to Ably as our event source and specified that we do not want the inbound event data to be JSON enveloped.
Without envelopes the events will be smaller, taking up less transmission bandwidth, however this then means we need 'sniff' each inbound event's data to identify whether it is an absolute value or a delta to be applied to the previously received value.

Absolute values are sent to us as strings, ready to use. Deltas are sent to us as Base64 encoded binary.

```js
const deltaCodec = require('@ably/delta-codec');
const EventSource = require('eventsource');

const prefix = '[?delta=vcdiff]';
const url = `https://realtime.ably.io/event-stream?channels=${prefix}${CHANNEL_NAME}&v=1.2&key=${APP_KEY}&enveloped=false`;
const eventSource = new EventSource(url);
const decoder = new deltaCodec.VcdiffDecoder();
eventSource.onmessage = function onEventSourceMessage(event) {
  const stringData = event.data;
  let value;
  if (deltaCodec.VcdiffDecoder.isBase64Delta(stringData)) {
    value = decoder.applyBase64Delta(stringData).asUtf8String();
  } else {
    value = stringData;
    decoder.setBase(value);
  }
  console.log(`received: ${value}`);
};
eventSource.onerror = function onEventSourceError(event) {
  console.log(`error: ${event.data}`);
};
```

### Node.js: Binary stream from Ably via MQTT

The raw binary data received over MQTT has no encoding or other form of envelope encapsulating it.
We need to 'sniff' each inbound payload to identify whether it is an absolute value or a delta to be applied to the previously received value.
In this example we are transporting UTF-8 encoded strings.

```js
const deltaCodec = require('@ably/delta-codec');
const mqtt = require('mqtt');

const brokerUrl = `mqtts://mqtt.ably.io`;
const options = {
  username: APP_KEY_NAME,
  password: APP_KEY_SECRET,
};
const prefix = '[?delta=vcdiff]';
const client = mqtt.connect(brokerUrl, options);
client.on('connect', () => {
  client.subscribe(`${prefix}${CHANNEL_NAME}`);
});
const decoder = new deltaCodec.VcdiffDecoder();
client.on('message', (topic, message) => {
  let value;
  if (deltaCodec.VcdiffDecoder.isDelta(message)) {
    value = decoder.applyDelta(message).asUtf8String();
  } else {
    decoder.setBase(message);
    value = message.toString();
  }
  console.log(`received: ${value}`);
});
```

## Contributing

### Building

You can trigger a build using Webpack with:

    npm run grunt -- build

which creates `delta-codec.js` and `delta-codec.min.js` in the `dist` folder.

### Testing

To run tests in all runtimes (Node and browsers):

    npm test

To run tests on a single runtime:

- Node (very quick): `npm run grunt -- test:node`
- Local browser (Firefox): `npm run grunt -- test:browser:local`
- Remote browsers (Safari, Firefox, Chrome, IE, Edge, Chrome Mobile and Mobile Safari): `npm run grunt -- test:browser:remote`

**Known Issue:**
When testing in a local browser either using `npm run grunt -- test:browser:local` or indirectly by using `npm test` on macOS, you may see a "segmentation fault". Launch the Console app to find the associated crash reports, of which there will be too. More information in [issue #7](https://github.com/ably/delta-codec-js/issues/7).

Remote browser testing supported by

[<img src="./resources/Browserstack-logo@2x.png" width="200px"></img>](https://www.browserstack.com/)

for which you will need to configure environment variables for `BROWSERSTACK_USERNAME` and `BROWSERSTACK_ACCESSKEY`.

## Release Procedure

On the `master` branch:

1. Increment the version, regenerate from source (a.k.a. build / bundle) and make a tagged commit which includes the built output from the `/dist` folder by running `npm run grunt -- release:patch` (or "major", "minor" or "prepatch" as appropriate - see [grunt-bump Usage Examples](https://github.com/vojtajina/grunt-bump#usage-examples))
2. Release the tagged commit to Github using `git push origin master --follow-tags`
3. Release to NPM using `npm publish . --access public` ([this package](https://www.npmjs.com/package/@ably/delta-codec) is configured to require that [2FA](https://docs.npmjs.com/configuring-two-factor-authentication) is used by publishers)
4. Release to Ably's CDN using `npm run grunt -- publish-cdn` (operable by Ably staff only)
5. Visit [tags](https://github.com/ably/delta-codec-js/tags) and draft new release for the newly created tag
