var assert = require('chai').assert;
var base64 = require('@protobufjs/base64');

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
	}
};

var invalidDeltaValues = [
	{ name: 'null', value: null },
	{ name: 'undefined', value: undefined },
	{ name: 'object', value: { } },
	{ name: 'number', value: 42 },
	{ name: 'string', value: 'data' }
];

var fixtures = {
	binary: {
		base: Uint8Array.from([76, 111, 114, 101, 109, 32, 105, 112, 115, 117, 109, 32, 100, 111, 108, 111, 114, 32, 115, 105, 116, 32, 97, 109, 101, 116]),
		delta: Uint8Array.from([214, 195, 196, 0, 0, 1, 26, 0, 40, 56, 0, 30, 4, 1, 44, 32, 99, 111, 110, 115, 101, 99, 116, 101, 116, 117, 114, 32, 97, 100, 105, 112, 105, 115, 99, 105, 110, 103, 32, 101, 108, 105, 116, 46, 19, 26, 1, 30, 0]),
		expectedResult: Uint8Array.from([76, 111, 114, 101, 109, 32, 105, 112, 115, 117, 109, 32, 100, 111, 108, 111, 114, 32, 115, 105, 116, 32, 97, 109, 101, 116, 44, 32, 99, 111, 110, 115, 101, 99, 116, 101, 116, 117, 114, 32, 97, 100, 105, 112, 105, 115, 99, 105, 110, 103, 32, 101, 108, 105, 116, 46])
	}
};

function getIsDeltaTests(isDelta, dataConverters) {
	return function() {
		function expectFalseOnInvalidInput(invalidDeltaValue) {
			it('should return false on invalid input - ' + invalidDeltaValue.name, function() {
				assert.isFalse(isDelta(invalidDeltaValue.value));
			});
		};

		invalidDeltaValues.forEach(expectFalseOnInvalidInput);

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

function getApplyDeltaTests(Decoder, applyDelta, setBase, dataConverters, additionalTests) {
	return function() {
		var context = {
			decoder: undefined
		};

		beforeEach(function() {
			context.decoder = new Decoder();
		});

		function expectExceptionOnUninitializedDecoder(data, dataConverter) {
			it('should throw on uninitialized decoder - ' + dataConverter.name, function() {
				assert.throws(function() {
					applyDelta(context.decoder, dataConverter.convert(data))
				});
			}, 'Uninitialized decoder - setBase() should be called first');
		}
	
		dataConverters.forEach(expectExceptionOnUninitializedDecoder.bind(null, fixtures.binary.delta));
	
		function runTestsWithDataConverter(dataConverter) {
			it('should throw on invalid delta - ' + dataConverter.name, function() {
				setBase(context.decoder, dataConverter.convert(Uint8Array.from([1, 2, 3])));
				assert.throws(function() {
					applyDelta(context.decoder, dataConverter.convert([1, 2, 3, 4]));
				}, 'The provided delta is not a valid VCDIFF delta');
			});
	
			it('should decode valid delta - ' + dataConverter.name, function() {
				setBase(context.decoder, dataConverter.convert(fixtures.binary.base));
				var result = applyDelta(context.decoder, dataConverter.convert(fixtures.binary.delta));
				assert.isTrue(!!result, 'applyDelta result is null or undefined');
				assert.sameOrderedMembers(Array.from(result.asUint8Array()), Array.from(fixtures.binary.expectedResult), 'applyDelta result is incorrect');
			});
		}
	
		dataConverters.forEach(runTestsWithDataConverter);

		additionalTests(context);
	};
}

module.exports = {
	converters: converters,
	invalidDeltaValues: invalidDeltaValues,
	fixtures: fixtures,
	getIsDeltaTests: function(Decoder, dataConverters) {
		return getIsDeltaTests(Decoder.isDelta, dataConverters);
	},
	getIsBase64DeltaTests: function(Decoder) {
		return getIsDeltaTests(Decoder.isBase64Delta, [converters.base64]);
	},
	getApplyDeltaTests: function(Decoder, dataConverters) {
		return getApplyDeltaTests(Decoder, function(decoder, delta) {
			return decoder.applyDelta(delta);
		}, function(decoder, base) {
			return decoder.setBase(base);
		}, dataConverters, function(context) {
			function expectExceptionOnNonBinaryData(invalidDeltaValue) {
				it('should throw on non-binary data - ' + invalidDeltaValue.name, function() {
					assert.throws(function() {
						context.decoder.applyDelta(invalidDeltaValue.value);
					}, 'The provided delta does not represent binary data');
				});
			}
		
			invalidDeltaValues.forEach(expectExceptionOnNonBinaryData);
		});
	},
	getApplyBase64DeltaTests: function(Decoder) {
		return getApplyDeltaTests(Decoder, function(decoder, delta) {
			return decoder.applyBase64Delta(delta);
		}, function(decoder, base) {
			return decoder.setBase64Base(base);
		}, [converters.base64], function(context) {
			console.log('TODO:!!!!');
		});
	}
};
