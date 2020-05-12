'use strict';

var vcdiff = require('@ably/vcdiff-decoder');
var utf8 = require('@protobufjs/utf8');
var base64 = require('@protobufjs/base64');

var isBuffer = require('./is_buffer');
var DeltaApplicationResult = require('./delta_application_result');

function VcdiffDecoder() {
	this._base = undefined;
}

function isDelta(data, toUint8Array) {
	if (!data) {
		return false;
	}
	try {
		var dataAsUint8Array = toUint8Array(data);
		return dataAsUint8Array[0] === 214 && // V
			dataAsUint8Array[1] === 195 && // C
			dataAsUint8Array[2] === 196 && // D
			dataAsUint8Array[3] === 0; // \0
	} catch(e) {
		return false;
	}
}

VcdiffDecoder.isDelta = function(data) {
	return isDelta(data, deltaToUint8Array);
};

VcdiffDecoder.isBase64Delta = function(data) {
	return isDelta(data, base64Decode);
};

function applyDelta(delta, toUint8Array) {
	if (!this._base) {
		throw new Error('Uninitialized decoder - setBase() should be called first');
	}
	var deltaAsUint8Array = toUint8Array(delta);
	if (!VcdiffDecoder.isDelta(deltaAsUint8Array)) {
		throw new Error('The provided delta is not a valid VCDIFF delta');
	}
	var decoded = decode(deltaAsUint8Array, this._base);
	this._base = decoded;
	// Return copy to avoid future delta application failures if the returned array is changed
	return new DeltaApplicationResult(new Uint8Array(decoded));
}

VcdiffDecoder.prototype.applyDelta = function(delta) {
	if (!isBinaryData(delta)) {
		throw new Error('The provided delta does not represent binary data');
	}
	return applyDelta.call(this, delta, deltaToUint8Array);
};

VcdiffDecoder.prototype.applyBase64Delta = function(delta) {
	return applyDelta.call(this, delta, base64Decode);
};

function setBase(newBase, toUint8Array) {
	if (newBase === null || newBase === undefined) {
		throw new Error('newBase cannot be null or undefined');
	}

	this._base = toUint8Array(newBase);
}

VcdiffDecoder.prototype.setBase = function(newBase) {
	setBase.call(this, newBase, baseToUint8Array);
};

VcdiffDecoder.prototype.setBase64Base = function(newBase) {
	setBase.call(this, newBase, base64Decode);
};

function isUint8Array(object) {
	return object instanceof Uint8Array;
}

function isArrayBuffer(object) {
	return object instanceof ArrayBuffer;
}

function isBinaryData(data) {
	return isArrayBuffer(data) || isUint8Array(data) || isBuffer(data);
}

function isString(data) {
	return typeof data === 'string';
}

function base64Decode(str) {
	if (typeof str !== 'string') {
		throw new Error('Unsupported data type. Supported type: string.');
	}
	var result = new Uint8Array(base64.length(str));
	base64.decode(str, result, 0);
	return result;
}

function utf8Encode(str) {
	var result = new Uint8Array(utf8.length(str));
	utf8.write(str, result, 0);
	return result;
}

function deltaToUint8Array(data) {
	if (isArrayBuffer(data)) {
		return new Uint8Array(data);
	} else if (isUint8Array(data) || isBuffer(data)) {
		return data;
	} else {
		throw new Error('Unsupported data type. Supported types: ArrayBuffer, Uint8Array, Buffer.');
	}
}

function baseToUint8Array(data) {
	if (isString(data)) {
		return utf8Encode(data);
	} else if (isArrayBuffer(data)) {
		return new Uint8Array(data);
	} else if (isUint8Array(data) || isBuffer(data)) {
		return data;
	} else {
		throw new Error('Unsupported data type. Supported types: string, ArrayBuffer, Uint8Array, Buffer.');
	}
}

function decode(delta, source) {
	return vcdiff.decode(delta, source);
}

module.exports = VcdiffDecoder;
