var common = require('./common');

var dataConverters = [common.converters.uint8Array, common.converters.arrayBuffer];

require('./vcdiff_decoder-tests')(DeltaCodec.VcdiffDecoder, dataConverters);
require('./checked_vcdiff_decoder-tests')(DeltaCodec.CheckedVcdiffDecoder, dataConverters);
