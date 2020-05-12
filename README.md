# Vcdiff Codec Library for JavaScript

[![Build Status](https://travis-ci.org/ably/delta-codec-js.svg?branch=master)](https://travis-ci.org/ably/delta-codec-js)

A Vcdiff codec library supporting the Vcdiff delta format, as defined by
[RFC 3284](https://tools.ietf.org/html/rfc3284).
This library supports developers who need to consume delta streams from Ably without using the official JavaScript client library (e.g. for
[MQTT](https://www.ably.io/concepts/mqtt)
and
[SSE](https://www.ably.io/concepts/server-sent-events)
applications).

Throughout this documentation, and within the code itself, we refer to a Vcdiff payload as a 'delta'.
Elsewhere such delta payloads may be referred to as patches or diffs, but for consistency within this repository we stick to the terms 'delta' and 'deltas'.

## Basic Stream Decoder

The `VcdiffDecoder` constructor provides the most basic entry point to the public API. It provides a stateful way of applying a stream of Vcdiff deltas, producing a new value after each delta has been applied to the previous value.

First provide the base value, upon which the first delta will be applied using the 'setBase' method:

```js
let decoder = new VcdiffDecoder();
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

### Text stream from Ably via SSE (enveloped)

By default the event data received from Ably is enveloped in JSON format.
We decode this data and inspect the Ably formatted message contents in order to establish whether the data in this message is an absolute value or a delta to be applied to the previously received value.

```js
const url = 'https://realtime.ably.io/sse?v=1.1&key=' + API_KEY + '&channels=' + CHANNEL_NAME;
const eventSource = new EventSource(url);
const decoder = new DeltaCodec.VcdiffDecoder();
eventSource.onmessage = (event) => {
    var message = JSON.parse(event.data);
    let stringData = message.data;
    try {
        if (message.extras.delta) {
            stringData = decoder.applyBase64Delta(stringData).asUtf8String();
        } else {
            decoder.setBase(stringData);
        }
    } catch(e) {
        console.log(e); // TODO: Handle error.
    }
    console.log(data); // TODO: Process the received value.
};
```

### Text stream from Ably via SSE (not enveloped)

For this example we have subscribed to Ably as our event source and specified that we do not want the inbound event data to be JSON enveloped.
Without envelopes the events will be smaller, taking up less transmission bandwidth, however this then means we need 'sniff' each inbound event's data to identify whether it is an absolute value or a delta to be applied to the previously received value.

Absolute values are sent to us as strings, ready to use. Deltas are sent to us as Base64 encoded binary.

```js
const url = 'https://realtime.ably.io/sse?v=1.1&key=' + API_KEY + '&channels=' + CHANNEL_NAME + '&enveloped=false';
const eventSource = new EventSource(url);
const decoder = new DeltaCodec.VcdiffDecoder();
eventSource.onmessage = (event) => {
    let stringData = event.data;
    try {
        if (VcdiffDecoder.isBase64Delta(stringData)) {
            stringData = decoder.applyBase64Delta(stringData).asUtf8String();
        } else {
            decoder.setBase(stringData);
        }
    } catch(e) {
        console.log(e); // TODO: Handle error.
    }
    console.log(data); // TODO: Process the received value.
};
```

### Binary stream from Ably via MQTT

The raw binary data received over MQTT has no encoding or other form of envelope encapsulating it.
We need to 'sniff' each inbound payload to identify whether it is an absolute value or a delta to be applied to the previously received value.

```js
const client = mqtt.connect(url, options);
const channelName = 'sample-app-mqtt';
const decoder = new VcdiffDecoder();
client.on('message', (_, payload) => {
    let data = payload;
    try {
        if (VcdiffDecoder.isDelta(data)) {
            data = decoder.applyDelta(data).asUint8Array();
        } else {
            decoder.setBase(data);
        }
    } catch(e) {
        console.log(e); // TODO: Handle error.
    }
    console.log(data); // TODO: Process the received value.
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
