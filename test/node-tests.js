var deltaCodec = require('../lib');
var common = require('./common');

var dataConverters = [common.converters.uint8Array, common.converters.arrayBuffer, {
	name: 'Buffer',
	convert: function(arr) { return Buffer.from(arr); }
}];

require('./vcdiff_decoder-tests')(deltaCodec.VcdiffDecoder, dataConverters);
require('./checked_vcdiff_decoder-tests')(deltaCodec.CheckedVcdiffDecoder, dataConverters);
