'use strict';

var VcdiffDecoder = require('./vcdiff_decoder');

function CheckedVcdiffDecoder() {
	this._decoder = new VcdiffDecoder();
	this._baseId = undefined;
}

CheckedVcdiffDecoder.isDelta = VcdiffDecoder.isDelta;
CheckedVcdiffDecoder.isBase64Delta = VcdiffDecoder.isBase64Delta;

function applyDelta(applyDeltaFunction, delta, deltaId, baseId) {
	if (this._baseId !== baseId) {
		throw new Error('The provided baseId does not match the last preserved baseId in the sequence');
	}
	var result = applyDeltaFunction(delta);
	this._baseId = deltaId;
	return result;
}

CheckedVcdiffDecoder.prototype.applyDelta = function(delta, deltaId, baseId) {
	return applyDelta(this._decoder.applyDelta, delta, deltaId, baseId);
};

CheckedVcdiffDecoder.prototype.applyBase64Delta = function(delta, deltaId, baseId) {
	return applyDelta(this._decoder.applyBase64Delta, delta, deltaId, baseId);
};

function setBase(setBaseFunction, newBase, newBaseId) {
	setBaseFunction(newBase);
	this._baseId = newBaseId;
}

CheckedVcdiffDecoder.prototype.setBase = function(newBase, newBaseId) {
	setBase(this._decoder.setBase, newBase, newBaseId);
};

CheckedVcdiffDecoder.prototype.setBase64Base = function(newBase, newBaseId) {
	setBase(this._decoder.setBase64Base, newBase, newBaseId);
};

module.exports = CheckedVcdiffDecoder;