module.exports = function(CheckedVcdiffDecoder, dataConverters) {
	var common = require('./common');

	describe('CheckedVcdiffDecoder', function() {
		describe('.isDelta', common.getIsDeltaTests(CheckedVcdiffDecoder, dataConverters));
		
		describe('.isBase64Delta', common.getIsBase64DeltaTests(CheckedVcdiffDecoder));
		
		describe('#applyDelta', function() { });
		
		describe('#applyBase64Delta', function() { });
		
		describe('#setBase', function() { });
		
		describe('#setBase64Base', function() { });
	});
};
