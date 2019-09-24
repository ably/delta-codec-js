'use strict';

var utf8 = require('@protobufjs/utf8');

function DeltaApplicationResult(data) {
	this.data = data;
}

DeltaApplicationResult.prototype.asUint8Array = function() {
	return this.data;
};

DeltaApplicationResult.prototype.asUtf8String = function() {
	return utf8.read(this.data, 0, this.data.length);
};

DeltaApplicationResult.prototype.asObject = function() {
	return JSON.parse(this.asUtf8String());
};

module.exports = DeltaApplicationResult;
