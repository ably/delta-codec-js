var assert = require('chai').assert;
var base64 = require('@protobufjs/base64');
var utf8 = require('@protobufjs/utf8');

var converters = {
	uint8Array: {
		name: 'Uint8Array',
		convert: function(arr) { return Uint8Array.from(arr); }
	},
	arrayBuffer: {
		name: 'ArrayBuffer',
		convert: function(arr) { return Uint8Array.from(arr).buffer; }
	},
	base64: {
		name: 'Base64',
		convert: function(arr) { return base64.encode(Uint8Array.from(arr), 0, arr.length); }
	},
	utf8: {
		name: 'UTF-8',
		convert: function(arr) { return utf8.read(Uint8Array.from(arr), 0, arr.length); }
	}
};

var invalidData = [
	{ name: 'null', value: null },
	{ name: 'undefined', value: undefined },
	{ name: 'object', value: { } },
	{ name: 'number', value: 42 }
];

var invalidBinaryDeltas = invalidData.concat({ name: 'string', value: 'data' });
var invalidBase64Deltas = invalidData;
var invalidBases = invalidData;

var fixtures = {
	binary: {
		base: Uint8Array.from([76, 111, 114, 101, 109, 32, 105, 112, 115, 117, 109, 32, 100, 111, 108, 111, 114, 32, 115, 105, 116, 32, 97, 109, 101, 116]),
		baseId: 'base',
		delta: Uint8Array.from([214, 195, 196, 0, 0, 1, 26, 0, 40, 56, 0, 30, 4, 1, 44, 32, 99, 111, 110, 115, 101, 99, 116, 101, 116, 117, 114, 32, 97, 100, 105, 112, 105, 115, 99, 105, 110, 103, 32, 101, 108, 105, 116, 46, 19, 26, 1, 30, 0]),
		deltaId: 'delta',
		expectedResult: Uint8Array.from([76, 111, 114, 101, 109, 32, 105, 112, 115, 117, 109, 32, 100, 111, 108, 111, 114, 32, 115, 105, 116, 32, 97, 109, 101, 116, 44, 32, 99, 111, 110, 115, 101, 99, 116, 101, 116, 117, 114, 32, 97, 100, 105, 112, 105, 115, 99, 105, 110, 103, 32, 101, 108, 105, 116, 46]),
		secondDelta: Uint8Array.from([214, 195, 196, 0, 0, 1, 56, 0, 69, 115, 0, 59, 4, 1, 32, 70, 117, 115, 99, 101, 32, 105, 100, 32, 110, 117, 108, 108, 97, 32, 108, 97, 99, 105, 110, 105, 97, 44, 32, 118, 111, 108, 117, 116, 112, 97, 116, 32, 111, 100, 105, 111, 32, 117, 116, 44, 32, 117, 108, 116, 114, 105, 99, 101, 115, 32, 108, 105, 103, 117, 108, 97, 46, 19, 56, 1, 59, 0]),
		secondDeltaId: 'second-delta',
		secondExpectedResult: Uint8Array.from([76, 111, 114, 101, 109, 32, 105, 112, 115, 117, 109, 32, 100, 111, 108, 111, 114, 32, 115, 105, 116, 32, 97, 109, 101, 116, 44, 32, 99, 111, 110, 115, 101, 99, 116, 101, 116, 117, 114, 32, 97, 100, 105, 112, 105, 115, 99, 105, 110, 103, 32, 101, 108, 105, 116, 46, 32, 70, 117, 115, 99, 101, 32, 105, 100, 32, 110, 117, 108, 108, 97, 32, 108, 97, 99, 105, 110, 105, 97, 44, 32, 118, 111, 108, 117, 116, 112, 97, 116, 32, 111, 100, 105, 111, 32, 117, 116, 44, 32, 117, 108, 116, 114, 105, 99, 101, 115, 32, 108, 105, 103, 117, 108, 97, 46])
	}
};

function getIsDeltaTests(isDelta, dataConverters, invalidDeltas) {
	return function() {
		function expectFalseOnInvalidDelta(invalidDelta) {
			it('should return false on invalid input - ' + invalidDelta.name, function() {
				assert.isFalse(isDelta(invalidDelta.value));
			});
		};

		invalidDeltas.forEach(expectFalseOnInvalidDelta);

		function runTestsWithDataConverter(dataConverter) {
			it('should return true on valid delta - ' + dataConverter.name, function() {
				assert.isTrue(isDelta(dataConverter.convert(fixtures.binary.delta)));
			});
	
			it('should return false on invalid delta - ' + dataConverter.name, function() {
				assert.isFalse(isDelta(dataConverter.convert([1, 2, 3, 4])));
			});
	
			it('should return false on data with less than 4 items - ' + dataConverter.name, function() {
				assert.isFalse(isDelta(dataConverter.convert([214])));
			});
		};

		dataConverters.forEach(runTestsWithDataConverter);
	};
};

function getApplyDeltaTests(Decoder, setBase, applyDelta, dataConverters, exceptionMessageOnInvalidDeltaType, invalidDeltas) {
	return function() {
		var decoder;

		beforeEach(function() {
			decoder = new Decoder();
		});

		function expectExceptionOnInvalidDelta(invalidDelta, dataConverter) {
			it('should throw on invalid delta type - ' + invalidDelta.name, function() {
				setBase(decoder, dataConverter.convert(Uint8Array.from([1, 2, 3])));
				assert.throws(function() {
					applyDelta(decoder, invalidDelta.value);
				}, exceptionMessageOnInvalidDeltaType);
			});
		}

		invalidDeltas.forEach(function(invalidDelta) {
			dataConverters.forEach(expectExceptionOnInvalidDelta.bind(null, invalidDelta));
		});

		function expectExceptionOnUninitializedDecoder(data, dataConverter) {
			it('should throw on uninitialized decoder - ' + dataConverter.name, function() {
				assert.throws(function() {
					applyDelta(decoder, dataConverter.convert(data))
				});
			}, 'Uninitialized decoder - setBase() should be called first');
		}
	
		dataConverters.forEach(expectExceptionOnUninitializedDecoder.bind(null, fixtures.binary.delta));
	
		function runTestsWithDataConverter(dataConverter) {
			it('should throw on invalid delta - ' + dataConverter.name, function() {
				setBase(decoder, dataConverter.convert(Uint8Array.from([1, 2, 3])));
				assert.throws(function() {
					applyDelta(decoder, dataConverter.convert([1, 2, 3, 4]));
				}, 'The provided delta is not a valid VCDIFF delta');
			});
	
			it('should decode valid delta - ' + dataConverter.name, function() {
				setBase(decoder, dataConverter.convert(fixtures.binary.base));
				var result = applyDelta(decoder, dataConverter.convert(fixtures.binary.delta));
				assert.isTrue(!!result, 'applyDelta() result is null or undefined');
				assert.sameOrderedMembers(Array.from(result.asUint8Array()), Array.from(fixtures.binary.expectedResult), 'applyDelta() result is incorrect');
			});

			it('should decode sequence of valid delta messages - ' + dataConverter.name, function() {
				setBase(decoder, dataConverter.convert(fixtures.binary.base));
				applyDelta(decoder, dataConverter.convert(fixtures.binary.delta));
				var result = applyDelta(decoder, dataConverter.convert(fixtures.binary.secondDelta));
				assert.isTrue(!!result, 'applyDelta() result is null or undefined');
				assert.sameOrderedMembers(Array.from(result.asUint8Array()), Array.from(fixtures.binary.secondExpectedResult), 'applyDelta() result is incorrect');
			});
		}
	
		dataConverters.forEach(runTestsWithDataConverter);
	};
}

function getSetBaseTests(Decoder, setBase, dataConverters) {
	return function() {
		var decoder;

		beforeEach(function() {
			decoder = new Decoder();
		});

		function expectExceptionOnInvalidBase(invalidBase) {
			it('should throw on invalid base type - ' + invalidBase.name, function() {
				assert.throws(function() {
					setBase(decoder, invalidBase.value);
				});
			});
		}

		invalidBases.forEach(expectExceptionOnInvalidBase);

		function expectToSuccessfullySetBase(dataConverter) {
			it('should successfully setBase() - ' + dataConverter.name, function() {
				setBase(decoder, dataConverter.convert(fixtures.binary.base));
				var result = decoder.applyDelta(fixtures.binary.delta);
				assert.isTrue(!!result, 'applyDelta() result is null or undefined');
				assert.sameOrderedMembers(Array.from(result.asUint8Array()), Array.from(fixtures.binary.expectedResult), 'applyDelta() result is incorrect');
			});
		}

		dataConverters.forEach(expectToSuccessfullySetBase);
	};
}

function setBase(decoder, base) { return decoder.setBase(base); }
function applyDelta(decoder, delta) { return decoder.applyDelta(delta); }
function setBase64Base(decoder, base) { return decoder.setBase64Base(base); }
function applyBase64Delta(decoder, delta) { return decoder.applyBase64Delta(delta); }

module.exports = {
	converters: converters,
	fixtures: fixtures,
	getIsDeltaTests: function(Decoder, dataConverters) {
		return getIsDeltaTests(Decoder.isDelta, dataConverters, invalidBinaryDeltas);
	},
	getIsBase64DeltaTests: function(Decoder) {
		return getIsDeltaTests(Decoder.isBase64Delta, [converters.base64], invalidBase64Deltas);
	},
	getApplyDeltaTests: function(Decoder, dataConverters) {
		return getApplyDeltaTests(Decoder, setBase, applyDelta, dataConverters, 'The provided delta does not represent binary data', invalidBinaryDeltas);
	},
	getApplyBase64DeltaTests: function(Decoder) {
		return getApplyDeltaTests(Decoder, setBase64Base, applyBase64Delta, [converters.base64], 'Unsupported data type. Supported type: string.', invalidBase64Deltas);
	},
	getSetBaseTests: function(Decoder, dataConverters) {
		return getSetBaseTests(Decoder, setBase, dataConverters.concat(converters.utf8));
	},
	getSetBase64BaseTests: function(Decoder) {
		return getSetBaseTests(Decoder, setBase64Base, [converters.base64]);
	}
};
