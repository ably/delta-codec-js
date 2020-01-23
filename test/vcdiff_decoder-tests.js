module.exports = function(VcdiffDecoder, dataConverters) {
	var common = require('./common');

	describe('VcdiffDecoder', function() {
		describe('.isDelta', common.getIsDeltaTests(VcdiffDecoder, dataConverters));
		
		describe('.isBase64Delta', common.getIsBase64DeltaTests(VcdiffDecoder));
		
		describe('#applyDelta', common.getApplyDeltaTests(VcdiffDecoder, dataConverters));
		
		describe('#applyBase64Delta', common.getApplyBase64DeltaTests(VcdiffDecoder));
		
		describe('#setBase', common.getSetBaseTests(VcdiffDecoder, dataConverters));
		
		describe('#setBase64Base', common.getSetBase64BaseTests(VcdiffDecoder));
	});
};