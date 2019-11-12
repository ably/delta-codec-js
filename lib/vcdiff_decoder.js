'use strict';

var vcdiff = require('@ably/vcdiff-decoder');
var utf8 = require('@protobufjs/utf8');
var base64 = require('@protobufjs/base64');

var isBuffer = require('./is_buffer');
var DeltaApplicationResult = require('./delta_application_result');

function VcdiffDecoder() { }

VcdiffDecoder.isDelta = function(data, isBase64Encoded) {
	if (!data) {
		return false;
	}
	try {
		var dataAsUint8Array = isBase64Encoded ? base64Decode(data) : toUint8Array(data);
		return dataAsUint8Array[0] === 214 && // V
			dataAsUint8Array[1] === 195 && // C
			dataAsUint8Array[2] === 196 && // D
			dataAsUint8Array[3] === 0; // \0
	} catch(e) {
		return false;
	}
};

VcdiffDecoder.applyDelta = function(delta, base, isDeltaBase64Encoded, isBaseBase64Encoded) {
	if (!delta) {
		throw new Error('delta cannot be null');
	}
	if (!base) {
		throw new Error('base cannot be null');
	}
	var deltaAsUint8Array = isDeltaBase64Encoded ? base64Decode(delta) : toUint8Array(delta);
	if (!VcdiffDecoder.isDelta(deltaAsUint8Array)) {
		throw new Error('The provided delta is not a valid VCDIFF delta');
	}
	var decoded = decode(deltaAsUint8Array, isBaseBase64Encoded ? base64Decode(base) : toUint8Array(base));
	return new DeltaApplicationResult(decoded);
};

VcdiffDecoder.prototype.applyDelta = function(delta, deltaId, baseId, isBase64Encoded) {
	if (!this.base) {
		throw new Error('Uninitialized decoder - setBase() should be called first');
	}
	if (this.baseId !== baseId) {
		throw new Error('The provided baseId does not match the last preserved baseId in the sequence');
	}
	var deltaAsUint8Array;
	if (isBase64Encoded) {
		deltaAsUint8Array = base64Decode(delta);
	} else {
		if (!isBinaryData(delta)) {
			throw new Error('The provided delta does not represent binary data');
		}
		deltaAsUint8Array = toUint8Array(delta);
	}
	if (!VcdiffDecoder.isDelta(deltaAsUint8Array)) {
		throw new Error('The provided delta is not a valid VCDIFF delta');
	}

	var decoded = decode(deltaAsUint8Array, this.base);
	this.base = decoded;
	this.baseId = deltaId;
	// Return copy to avoid future delta application failures if the returned array is changed
	return new DeltaApplicationResult(new Uint8Array(decoded));
};

VcdiffDecoder.prototype.setBase = function(newBase, newBaseId, isBase64Encoded) {
	if (newBase === null || newBase === undefined) {
		throw new Error('newBase cannot be null or undefined');
	}

	this.base = isBase64Encoded ? base64Decode(newBase) : toUint8Array(newBase);
	this.baseId = newBaseId;
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
	var result = new Uint8Array(base64.length(str));
	base64.decode(str, result, 0);
	return result;
}

function utf8Encode(str) {
	var result = new Uint8Array(utf8.length(str));
	utf8.write(str, result, 0);
	return result;
}

function toUint8Array(data) {
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
	return vcdiff.decodeSync(delta, source);
}

module.exports = VcdiffDecoder;
