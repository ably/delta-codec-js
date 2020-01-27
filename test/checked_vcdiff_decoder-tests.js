module.exports = function(CheckedVcdiffDecoder, dataConverters) {
	var assert = require('chai').assert;
	var common = require('./common');

	function mergeTests() {
		var tests = Array.from(arguments);
		return function() {
			tests.forEach(function(test) {
				test();
			});
		};
	}

	function getSequenceContinuityTests(setBase, applyDelta) {
		return function() {
			var decoder;

			beforeEach(function() {
				decoder = new CheckedVcdiffDecoder();
			});

			it('should throw exception when the provided baseId does not match the one set with setBase()', function() {
				setBase(decoder, common.fixtures.binary.base, common.fixtures.binary.baseId);
				assert.throws(function() {
					applyDelta(decoder, common.fixtures.binary.delta, common.fixtures.binary.deltaId, 'invalid-base-id');
				}, 'The provided baseId does not match the last preserved baseId in the sequence');
			});

			it('should apply delta when the provided baseId does match the one set with setBase()', function() {
				setBase(decoder, common.fixtures.binary.base, common.fixtures.binary.baseId);
				var result = applyDelta(decoder, common.fixtures.binary.delta, common.fixtures.binary.deltaId, common.fixtures.binary.baseId);
				assert.isTrue(!!result, 'applyDelta() result is null or undefined');
			});

			it('should throw exception when the provided baseId does not match the preserved one', function() {
				setBase(decoder, common.fixtures.binary.base, common.fixtures.binary.baseId);
				applyDelta(decoder, common.fixtures.binary.delta, common.fixtures.binary.deltaId, common.fixtures.binary.baseId);
				assert.throws(function() {
					applyDelta(decoder, common.fixtures.binary.secondDelta, common.fixtures.binary.secondDeltaId, 'invalid-base-id');
				}, 'The provided baseId does not match the last preserved baseId in the sequence');
			});

			it('should apply delta when the provided baseId does match the preserved one', function() {
				setBase(decoder, common.fixtures.binary.base, common.fixtures.binary.baseId);
				applyDelta(decoder, common.fixtures.binary.delta, common.fixtures.binary.deltaId, common.fixtures.binary.baseId);
				var result = applyDelta(decoder, common.fixtures.binary.secondDelta, common.fixtures.binary.secondDeltaId, common.fixtures.binary.deltaId);
				assert.isTrue(!!result, 'applyDelta() result is null or undefined');
			});
		};
	}

	function setBase(decoder, base, baseId) { return decoder.setBase(base, baseId); }
	function applyDelta(decoder, delta, deltaId, baseId) { return decoder.applyDelta(delta, deltaId, baseId); }
	function setBase64Base(decoder, base, baseId) { return decoder.setBase64Base(base, baseId); }
	function applyBase64Delta(decoder, delta, deltaId, baseId) { return decoder.applyBase64Delta(delta, deltaId, baseId); }

	describe('CheckedVcdiffDecoder', function() {
		describe('.isDelta', common.getIsDeltaTests(CheckedVcdiffDecoder, dataConverters));
		
		describe('.isBase64Delta', common.getIsBase64DeltaTests(CheckedVcdiffDecoder));
		
		describe('#applyDelta', mergeTests(common.getApplyDeltaTests(CheckedVcdiffDecoder, dataConverters), getSequenceContinuityTests(setBase, applyDelta)));
		
		describe('#applyBase64Delta', mergeTests(common.getApplyBase64DeltaTests(CheckedVcdiffDecoder)), getSequenceContinuityTests(setBase64Base, applyBase64Delta));
		
		describe('#setBase', common.getSetBaseTests(CheckedVcdiffDecoder, dataConverters));
		
		describe('#setBase64Base', common.getSetBase64BaseTests(CheckedVcdiffDecoder));
	});
};
