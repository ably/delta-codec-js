var DeltaCodec =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

var VcdiffDecoder = __webpack_require__(1);

module.exports = {
  VcdiffDecoder: VcdiffDecoder
};

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var vcdiff = __webpack_require__(2);

var utf8 = __webpack_require__(12);

var base64 = __webpack_require__(13);

var isBuffer = __webpack_require__(14);

var DeltaApplicationResult = __webpack_require__(15);

function VcdiffDecoder() {}

VcdiffDecoder.isDelta = function (data, isBase64Encoded) {
  if (!data) {
    return false;
  }

  try {
    var dataAsUint8Array = isBase64Encoded ? base64Decode(data) : toUint8Array(data);
    return dataAsUint8Array[0] === 214 && // V
    dataAsUint8Array[1] === 195 && // C
    dataAsUint8Array[2] === 196 && // D
    dataAsUint8Array[3] === 0; // \0
  } catch (e) {
    return false;
  }
};

VcdiffDecoder.applyDelta = function (delta, base, isDeltaBase64Encoded, isBaseBase64Encoded) {
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

VcdiffDecoder.prototype.applyDelta = function (delta, deltaId, baseId, isBase64Encoded) {
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
  this.baseId = deltaId; // Return copy to avoid future delta application failures if the returned array is changed

  return new DeltaApplicationResult(new Uint8Array(decoded));
};

VcdiffDecoder.prototype.setBase = function (newBase, newBaseId, isBase64Encoded) {
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

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

const errors = __webpack_require__(3);
const VCDiff = __webpack_require__(4);

/**
 *
 * @param delta {Uint8Array}
 * @param source {Uint8Array}
 */
function decodeSync(delta, source) {
  let vcdiff = new VCDiff(delta, source);
  return vcdiff.decode();
}

function decode(delta, buffer) {

}

module.exports = {
  decodeSync,
  decode
};




/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * Takes in array of names of errors and returns an object mapping those names to error functions that take in one parameter that is used as the message for the error
 * @param names {[]}
 * @returns {{name1: function(message),...}}
 * @constructor
 */
function CustomErrors(names) {
  let errors = {};
  names.forEach(name => {
    let CustomError = function CustomError(message) {
      var temp = Error.apply(this, arguments);
      temp.name = this.name = name;
      this.stack = temp.stack;
      this.message = temp.message;
      this.name = name;
      this.message = message;
    };
    CustomError.prototype = Object.create(Error.prototype, {
      constructor: {
        value: CustomError,
        writable: true,
        configurable: true
      }
    });
    errors[name] = CustomError;
  });
  return errors;
}

module.exports = CustomErrors(['NotImplemented', 'InvalidDelta']);

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const errors = __webpack_require__(3);
const TypedArray = __webpack_require__(5);
const deserializeInteger = __webpack_require__(6);
const deserializeDelta = __webpack_require__(7);
const NearCache = __webpack_require__(10);
const SameCache = __webpack_require__(11);

/**
 *
 * @param delta {Uint8Array}
 * @param source {Uint8Array}
 * @constructor
 */
function VCDiff(delta, source) {
  this.delta = delta;
  this.position = 0;
  this.source = source;
  this.targetWindows = new TypedArray.TypedArrayList();
}

VCDiff.prototype.decode = function() {
  this._consumeHeader();
  while (this._consumeWindow()) {}

  let targetLength = this.targetWindows.typedArrays.reduce((sum, uint8Array) => uint8Array.length + sum, 0);
  let target = new Uint8Array(targetLength);
  let position = 0;

  // concat all uint8arrays
  for (let arrayNum = 0; arrayNum < this.targetWindows.typedArrays.length; arrayNum++) {
    let array = this.targetWindows.typedArrays[arrayNum];
    let length = array.length;
    target.set(array, position);
    position += length;
  }

  return target;
};

VCDiff.prototype._consumeHeader = function() {

  let hasVCDiffHeader = this.delta[0] === 214 && // V
      this.delta[1] === 195 && // C
      this.delta[2] === 196 && // D
      this.delta[3] === 0; // \0

  if (!hasVCDiffHeader) {
    throw new errors.InvalidDelta('first 3 bytes not VCD');
  }

  let hdrIndicator = this.delta[4];
  // extract least significant bit
  let vcdDecompress = 1 & hdrIndicator;
  // extract second least significant bit
  let vcdCodetable = 1 & (hdrIndicator >> 1);

  // verify not using Hdr_Indicator
  if (vcdDecompress || vcdCodetable) {
    throw new errors.NotImplemented(
      'non-zero Hdr_Indicator (VCD_DECOMPRESS or VCD_CODETABLE bit is set)'
    );
  }

  this.position += 5;
};

VCDiff.prototype._consumeWindow = function() {
  let winIndicator = this.delta[this.position++];

  // extract least significant bit
  let vcdSource = 1 & winIndicator;
  // extract second least significant bit
  let vcdTarget = 1 & (winIndicator >> 1);

  if (vcdSource && vcdTarget) {
    throw new errors.InvalidDelta(
      'VCD_SOURCE and VCD_TARGET cannot both be set in Win_Indicator'
    )
  }
  else if (vcdSource) {
    let sourceSegmentLength, sourceSegmentPosition, deltaLength;
    ({ value: sourceSegmentLength, position: this.position } = deserializeInteger(this.delta, this.position));
    ({ value: sourceSegmentPosition, position: this.position } = deserializeInteger(this.delta, this.position));
    ({ value: deltaLength, position: this.position } = deserializeInteger(this.delta, this.position));

    let sourceSegment = this.source.slice(sourceSegmentPosition, sourceSegmentPosition + sourceSegmentLength);
    this._buildTargetWindow(this.position, sourceSegment);
    this.position += deltaLength;
  }
  else if (vcdTarget) {
    throw new errors.NotImplemented(
      'non-zero VCD_TARGET in Win_Indicator'
    )
  }
  else {
    let deltaLength;
    ({ value: deltaLength, position: this.position } = deserializeInteger(this.delta, this.position));

    this._buildTargetWindow(this.position);
    this.position += deltaLength;
  }

  return this.position < this.delta.length;
};

// first integer is target window length
VCDiff.prototype._buildTargetWindow = function(position, sourceSegment) {
  let window = deserializeDelta(this.delta, position);

  let T = new Uint8Array(window.targetWindowLength);

  let U = new TypedArray.TypedArrayList();
  let uTargetPosition = 0;
  if (sourceSegment) {
    U.add(sourceSegment);
    uTargetPosition = sourceSegment.length;
  }
  U.add(T);

  let targetPosition = this.source.length;
  let dataPosition = 0;

  let delta = new Delta(U, uTargetPosition, window.data, window.addresses);
  window.instructions.forEach(instruction => {
    instruction.execute(delta);
  });

  this.targetWindows.add(T);
};

function Delta(U, UTargetPosition, data, addresses) {
  this.U = U;
  this.UTargetPosition = UTargetPosition;
  this.data = data;
  this.dataPosition = 0;
  this.addresses = addresses;
  this.addressesPosition = 0;
  this.nearCache = new NearCache(4);
  this.sameCache = new SameCache(3);
}

Delta.prototype.getNextAddressInteger = function() {
  let value;
  // get next address and increase the address position for the next address
  ({value, position: this.addressesPosition } = deserializeInteger(this.addresses, this.addressesPosition));
  return value;
};

Delta.prototype.getNextAddressByte = function() {
  // get next address and increase the address position for the next address
  let value = this.addresses[this.addressesPosition++];
  return value;
};

module.exports = VCDiff;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function uint8ArrayToString(uintArray) {
  let encodedString = String.fromCharCode.apply(null, uintArray);
  let decodedString = decodeURIComponent(escape(encodedString));
  return decodedString;
}

function stringToUint8Array(str) {
  var buf = new Uint8Array(str.length);
  for (var i=0, strLen=str.length; i < strLen; i++) {
    buf[i] = str.charCodeAt(i);
  }
  return buf;
}

function equal(typedArray1, typedArray2) {
  if (typedArray1.length !== typedArray2.length) {
    return false;
  }
  for (let i = 0; i < typedArray1.length; i++) {
    if (typedArray1[i] !== typedArray2[i]) {
      return false;
    }
  }
  return true;
}

function TypedArrayList() {
  this.typedArrays = [];
  this.startIndexes = [];
  this.length = 0;
}

TypedArrayList.prototype.add = function(typedArray) {
  let typedArrayTypes = [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array,
    Int32Array, Uint32Array, Float32Array, Float64Array];

  let matchingTypedArrayTypes = typedArrayTypes.filter(typedArrayType => typedArray instanceof typedArrayType);
  if (matchingTypedArrayTypes.length < 1) {
    throw Error('Given ' + typeof typedArray + ' when expected a TypedArray');
  }

  let startIndex;
  if (this.typedArrays.length === 0) {
    startIndex = 0;
  }
  else {
    let lastIndex = this.startIndexes.length - 1;
    let lastStartIndex = this.startIndexes[lastIndex];
    let lastLength = this.typedArrays[lastIndex].length;
    startIndex = lastStartIndex + lastLength;
  }

  this.startIndexes.push(startIndex);
  this.typedArrays.push(typedArray);
  this.length += startIndex + typedArray.length;
};

TypedArrayList.prototype.get = function(index) {
  let listIndex = getIndex(this.startIndexes, index);
  let typedArray = index - this.startIndexes[listIndex];
  return this.typedArrays[listIndex][typedArray];
};

TypedArrayList.prototype.set = function(index, value) {
  if (typeof index !== 'number' || isNaN(index)) {
    throw new Error('Given non-number index: ' + index);
  }
  //console.log(index);

  let listIndex = getIndex(this.startIndexes, index);
  let typedArrayIndex = index - this.startIndexes[listIndex];
  this.typedArrays[listIndex][typedArrayIndex] = value;
};

function getIndex(arr, element) {
  // Performance optimization for most common case
  if (arr.length === 2) {
    return element < arr[1] ? 0 : 1;
  }

  let low = 0;
  let high = arr.length - 1;

  while (low < high) {
    let mid = Math.floor((low + high) / 2);

    if (arr[mid] === element) {
      return mid;
    }
    else if (arr[mid] < element) {
      low = mid + 1;
    }
    else {
      high = mid - 1;
    }
  }
  if (arr[high] > element) {
    return high - 1;
  }
  else {
    return high;
  }
}

module.exports = {
  uint8ArrayToString,
  stringToUint8Array,
  equal,
  TypedArrayList
};



/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Converts RFC 3284 definition of integer in buffer to decimal
 * Also returns the index of the byte after the integer
 * @param buffer {Uint8Array}
 * @param position {Number}
 * @returns {{position: {Number}, value: {Number}}}
 */
function integer(buffer, position) {
  const result = { position, value: 0 };

  do {
    /* Shift the existing value left for 7 bits (base127 conversion)
       and merge it with the next value without its highest bit */
    result.value = (result.value << 7) | (buffer[result.position] & 127);

    /* Avoid Number overflows */
    if (result.value < 0) {
      throw new Error('RFC 3284 Integer conversion: Buffer overflow');
    }
  } while (buffer[result.position++] & 128);

  return result;
}

module.exports = integer;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const errors = __webpack_require__(3);
const deserializeInteger = __webpack_require__(6);
const tokenizeInstructions = __webpack_require__(8);

function delta(delta, position) {

  let targetWindowLength, dataLength, instructionsLength, addressesLength;

  // parentheses are needed for assignment destructuring
  ({ value: targetWindowLength, position } = deserializeInteger(delta, position));

  // Delta_Indicator byte
  if (delta[position] !== 0) {
    throw new errors.NotImplemented(
      'VCD_DECOMPRESS is not supported, Delta_Indicator must be zero at byte ' + position + ' and not ' + delta[position]
    );
  }
  position++;

  ({ value: dataLength, position } = deserializeInteger(delta, position));
  ({ value: instructionsLength, position } = deserializeInteger(delta, position));
  ({ value: addressesLength, position } = deserializeInteger(delta, position));

  let dataNextPosition = position + dataLength;
  let data = delta.slice(position, dataNextPosition);

  let instructionsNextPosition = dataNextPosition + instructionsLength;
  let instructions = delta.slice(dataNextPosition, instructionsNextPosition);
  let deserializedInstructions = tokenizeInstructions(instructions);

  let addressesNextPosition = instructionsNextPosition + addressesLength;
  let addresses = delta.slice(instructionsNextPosition, addressesNextPosition);

  position = addressesNextPosition;

  let window = {
    targetWindowLength,
    position,
    data,
    instructions: deserializedInstructions,
    addresses
  };

  return window;
}

module.exports = delta;



/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const instructions = __webpack_require__(9);
const deserializeInteger = __webpack_require__(6);

function tokenizeInstructions(instructionsBuffer) {
  let deserializedInstructions = [];

  let instructionsPosition = 0;

  while (instructionsPosition < instructionsBuffer.length) {
    let index = instructionsBuffer[instructionsPosition++];

    let addSize, copySize, size;

    if (index === 0) {
      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
      deserializedInstructions.push(new instructions.RUN(size));
    }
    else if (index === 1) {
      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
      deserializedInstructions.push(new instructions.ADD(size));
    }
    else if (index < 19) {
      deserializedInstructions.push(new instructions.ADD(index - 1));
    }
    else if (index === 19) {
      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
      deserializedInstructions.push(new instructions.COPY(size, 0));
    }
    else if (index < 35) {
      deserializedInstructions.push(new instructions.COPY(index - 16, 0));
    }
    else if (index === 35) {
      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
      deserializedInstructions.push(new instructions.COPY(size, 1));
    }
    else if (index < 51) {
      deserializedInstructions.push(new instructions.COPY(index - 32, 1));
    }
    else if (index === 51) {
      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
      deserializedInstructions.push(new instructions.COPY(size, 2));
    }
    else if (index < 67) {
      deserializedInstructions.push(new instructions.COPY(index - 48, 2));
    }
    else if (index === 67) {
      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
      deserializedInstructions.push(new instructions.COPY(size, 3));
    }
    else if (index < 83) {
      deserializedInstructions.push(new instructions.COPY(index - 64, 3));
    }
    else if (index === 83) {
      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
      deserializedInstructions.push(new instructions.COPY(size, 4));
    }
    else if (index < 99) {
      deserializedInstructions.push(new instructions.COPY(index - 80, 4));
    }
    else if (index === 99) {
      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
      deserializedInstructions.push(new instructions.COPY(size, 5));
    }
    else if (index < 115) {
      deserializedInstructions.push(new instructions.COPY(index - 96, 5));
    }
    else if (index === 115) {
      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
      deserializedInstructions.push(new instructions.COPY(size, 6));
    }
    else if (index < 131) {
      deserializedInstructions.push(new instructions.COPY(index - 112, 6));
    }
    else if (index === 131) {
      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
      deserializedInstructions.push(new instructions.COPY(size, 7));
    }
    else if (index < 147) {
      deserializedInstructions.push(new instructions.COPY(index - 128, 7));
    }
    else if (index === 147) {
      ({ value: size, position: instructionsPosition } = deserializeInteger(instructionsBuffer, instructionsPosition));
      deserializedInstructions.push(new instructions.COPY(size, 8));
    }
    else if (index < 163) {
      deserializedInstructions.push(new instructions.COPY(index - 144, 8));
    }
    else if (index < 175) {
      ({addSize, copySize} = ADD_COPY(index, 163));

      deserializedInstructions.push(new instructions.ADD(addSize));
      deserializedInstructions.push(new instructions.COPY(copySize, 0));
    }
    else if (index < 187) {
      ({addSize, copySize} = ADD_COPY(index, 175));

      deserializedInstructions.push(new instructions.ADD(addSize));
      deserializedInstructions.push(new instructions.COPY(copySize, 1));
    }
    else if (index < 199) {
      ({addSize, copySize} = ADD_COPY(index, 187));

      deserializedInstructions.push(new instructions.ADD(addSize));
      deserializedInstructions.push(new instructions.COPY(copySize, 2));
    }
    else if (index < 211) {
      ({addSize, copySize} = ADD_COPY(index, 199));

      deserializedInstructions.push(new instructions.ADD(addSize));
      deserializedInstructions.push(new instructions.COPY(copySize, 3));
    }
    else if (index < 223) {
      ({addSize, copySize} = ADD_COPY(index, 211));

      deserializedInstructions.push(new instructions.ADD(addSize));
      deserializedInstructions.push(new instructions.COPY(copySize, 4));
    }
    else if (index < 235) {
      ({addSize, copySize} = ADD_COPY(index, 223));

      deserializedInstructions.push(new instructions.ADD(addSize));
      deserializedInstructions.push(new instructions.COPY(copySize, 5));
    }
    else if (index < 239) {
      deserializedInstructions.push(new instructions.ADD(index - 235 + 1));
      deserializedInstructions.push(new instructions.COPY(4, 6));
    }
    else if (index < 243) {
      deserializedInstructions.push(new instructions.ADD(index - 239 + 1));
      deserializedInstructions.push(new instructions.COPY(4, 7));
    }
    else if (index < 247) {
      deserializedInstructions.push(new instructions.ADD(index - 243 + 1));
      deserializedInstructions.push(new instructions.COPY(4, 8));
    }
    else if (index < 256) {
      deserializedInstructions.push(new instructions.COPY(4, index - 247));
      deserializedInstructions.push(new instructions.ADD(1));
    }
    else {
      throw new Error('Should not get here');
    }
  }

  return deserializedInstructions;
}

function ADD_COPY(index, baseIndex) {
  let zeroBased = index - baseIndex;

  // 0,1,2 -> 0   3,4,5 -> 1   etc.
  let addSizeIndex = Math.floor(zeroBased / 3);
  // offset so size starts at 1
  let addSize = addSizeIndex + 1;

  // rotate through 0, 1, and 2
  let copySizeIndex = zeroBased % 3;
  // offset so size starts at 4
  let copySize = copySizeIndex + 4;

  return {addSize, copySize};
}

module.exports = tokenizeInstructions;

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const deserializeInteger = __webpack_require__(6);
const TypedArray = __webpack_require__(5);

function ADD(size) {
  this.size = size;
}
function COPY(size, mode) {
  this.size = size;
  this.mode = mode;
}
function RUN(size) {
  this.size = size;
}

ADD.prototype.name = 'ADD';
COPY.prototype.name = 'COPY';
RUN.prototype.name = 'RUN';

ADD.prototype.execute = function(delta) {
  for (let i = 0; i < this.size; i++) {
    delta.U.set(delta.UTargetPosition + i, delta.data[delta.dataPosition + i]);
  }
  delta.dataPosition += this.size;
  delta.UTargetPosition += this.size;
};

COPY.prototype.execute = function(delta) {
  let address, m, next, method;

  if (this.mode === 0) {
    address = delta.getNextAddressInteger();
  }
  else if (this.mode === 1) {
    next = delta.getNextAddressInteger();
    address = delta.UTargetPosition - next;
  }
  else if ((m = this.mode - 2) >= 0 && (m < delta.nearCache.size)) {
    next = delta.getNextAddressInteger();
    address = delta.nearCache.get(m, next);
    method = 'near';
  }
  // same cache
  else {
    m = this.mode - (2 + delta.nearCache.size);
    next = delta.getNextAddressByte();
    address = delta.sameCache.get(m, next);
    method = 'same';
  }

  delta.nearCache.update(address);
  delta.sameCache.update(address);

  for (let i = 0; i < this.size; i++) {
    delta.U.set(delta.UTargetPosition + i, delta.U.get(address + i));
  }

  delta.UTargetPosition += this.size;
};

RUN.prototype.execute = function(delta) {
  for (let i = 0; i < this.size; i++) {
    // repeat single byte
    delta.U.set(delta.UTargetPosition + i, delta.data[delta.dataPosition]);
  }
  // increment to next byte
  delta.dataPosition++;
  delta.UTargetPosition += this.size;
};

let instructions = {
  ADD,
  COPY,
  RUN
};

module.exports = instructions;

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function NearCache(size) {
  this.size = size;
  this.near = new Array(this.size).fill(0);
  this.nextSlot = 0;
}

NearCache.prototype.update = function(address) {
  if (this.near.length > 0) {
    this.near[this.nextSlot] = address;
    this.nextSlot = (this.nextSlot + 1) % this.near.length;
  }
};

NearCache.prototype.get = function(m, offset) {
  let address = this.near[m] + offset;
  return address;
};

module.exports = NearCache;

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function SameCache(size) {
  this.size = size;
  this.same = new Array(this.size * 256).fill(0);
}

SameCache.prototype.update = function(address) {
  if (this.same.length > 0) {
    this.same[address % (this.size * 256)] = address;
  }
};

SameCache.prototype.get = function(m, offset) {
  let address = this.same[m * 256 + offset];
  return address;
};

module.exports = SameCache;

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * A minimal UTF8 implementation for number arrays.
 * @memberof util
 * @namespace
 */
var utf8 = exports;

/**
 * Calculates the UTF8 byte length of a string.
 * @param {string} string String
 * @returns {number} Byte length
 */
utf8.length = function utf8_length(string) {
    var len = 0,
        c = 0;
    for (var i = 0; i < string.length; ++i) {
        c = string.charCodeAt(i);
        if (c < 128)
            len += 1;
        else if (c < 2048)
            len += 2;
        else if ((c & 0xFC00) === 0xD800 && (string.charCodeAt(i + 1) & 0xFC00) === 0xDC00) {
            ++i;
            len += 4;
        } else
            len += 3;
    }
    return len;
};

/**
 * Reads UTF8 bytes as a string.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {string} String read
 */
utf8.read = function utf8_read(buffer, start, end) {
    var len = end - start;
    if (len < 1)
        return "";
    var parts = null,
        chunk = [],
        i = 0, // char offset
        t;     // temporary
    while (start < end) {
        t = buffer[start++];
        if (t < 128)
            chunk[i++] = t;
        else if (t > 191 && t < 224)
            chunk[i++] = (t & 31) << 6 | buffer[start++] & 63;
        else if (t > 239 && t < 365) {
            t = ((t & 7) << 18 | (buffer[start++] & 63) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63) - 0x10000;
            chunk[i++] = 0xD800 + (t >> 10);
            chunk[i++] = 0xDC00 + (t & 1023);
        } else
            chunk[i++] = (t & 15) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63;
        if (i > 8191) {
            (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
            i = 0;
        }
    }
    if (parts) {
        if (i)
            parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
        return parts.join("");
    }
    return String.fromCharCode.apply(String, chunk.slice(0, i));
};

/**
 * Writes a string as UTF8 bytes.
 * @param {string} string Source string
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Bytes written
 */
utf8.write = function utf8_write(string, buffer, offset) {
    var start = offset,
        c1, // character 1
        c2; // character 2
    for (var i = 0; i < string.length; ++i) {
        c1 = string.charCodeAt(i);
        if (c1 < 128) {
            buffer[offset++] = c1;
        } else if (c1 < 2048) {
            buffer[offset++] = c1 >> 6       | 192;
            buffer[offset++] = c1       & 63 | 128;
        } else if ((c1 & 0xFC00) === 0xD800 && ((c2 = string.charCodeAt(i + 1)) & 0xFC00) === 0xDC00) {
            c1 = 0x10000 + ((c1 & 0x03FF) << 10) + (c2 & 0x03FF);
            ++i;
            buffer[offset++] = c1 >> 18      | 240;
            buffer[offset++] = c1 >> 12 & 63 | 128;
            buffer[offset++] = c1 >> 6  & 63 | 128;
            buffer[offset++] = c1       & 63 | 128;
        } else {
            buffer[offset++] = c1 >> 12      | 224;
            buffer[offset++] = c1 >> 6  & 63 | 128;
            buffer[offset++] = c1       & 63 | 128;
        }
    }
    return offset - start;
};


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * A minimal base64 implementation for number arrays.
 * @memberof util
 * @namespace
 */
var base64 = exports;

/**
 * Calculates the byte length of a base64 encoded string.
 * @param {string} string Base64 encoded string
 * @returns {number} Byte length
 */
base64.length = function length(string) {
    var p = string.length;
    if (!p)
        return 0;
    var n = 0;
    while (--p % 4 > 1 && string.charAt(p) === "=")
        ++n;
    return Math.ceil(string.length * 3) / 4 - n;
};

// Base64 encoding table
var b64 = new Array(64);

// Base64 decoding table
var s64 = new Array(123);

// 65..90, 97..122, 48..57, 43, 47
for (var i = 0; i < 64;)
    s64[b64[i] = i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i - 59 | 43] = i++;

/**
 * Encodes a buffer to a base64 encoded string.
 * @param {Uint8Array} buffer Source buffer
 * @param {number} start Source start
 * @param {number} end Source end
 * @returns {string} Base64 encoded string
 */
base64.encode = function encode(buffer, start, end) {
    var parts = null,
        chunk = [];
    var i = 0, // output index
        j = 0, // goto index
        t;     // temporary
    while (start < end) {
        var b = buffer[start++];
        switch (j) {
            case 0:
                chunk[i++] = b64[b >> 2];
                t = (b & 3) << 4;
                j = 1;
                break;
            case 1:
                chunk[i++] = b64[t | b >> 4];
                t = (b & 15) << 2;
                j = 2;
                break;
            case 2:
                chunk[i++] = b64[t | b >> 6];
                chunk[i++] = b64[b & 63];
                j = 0;
                break;
        }
        if (i > 8191) {
            (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
            i = 0;
        }
    }
    if (j) {
        chunk[i++] = b64[t];
        chunk[i++] = 61;
        if (j === 1)
            chunk[i++] = 61;
    }
    if (parts) {
        if (i)
            parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
        return parts.join("");
    }
    return String.fromCharCode.apply(String, chunk.slice(0, i));
};

var invalidEncoding = "invalid encoding";

/**
 * Decodes a base64 encoded string to a buffer.
 * @param {string} string Source string
 * @param {Uint8Array} buffer Destination buffer
 * @param {number} offset Destination offset
 * @returns {number} Number of bytes written
 * @throws {Error} If encoding is invalid
 */
base64.decode = function decode(string, buffer, offset) {
    var start = offset;
    var j = 0, // goto index
        t;     // temporary
    for (var i = 0; i < string.length;) {
        var c = string.charCodeAt(i++);
        if (c === 61 && j > 1)
            break;
        if ((c = s64[c]) === undefined)
            throw Error(invalidEncoding);
        switch (j) {
            case 0:
                t = c;
                j = 1;
                break;
            case 1:
                buffer[offset++] = t << 2 | (c & 48) >> 4;
                t = c;
                j = 2;
                break;
            case 2:
                buffer[offset++] = (t & 15) << 4 | (c & 60) >> 2;
                t = c;
                j = 3;
                break;
            case 3:
                buffer[offset++] = (t & 3) << 6 | c;
                j = 0;
                break;
        }
    }
    if (j === 1)
        throw Error(invalidEncoding);
    return offset - start;
};

/**
 * Tests if the specified string appears to be base64 encoded.
 * @param {string} string String to test
 * @returns {boolean} `true` if probably base64 encoded, otherwise false
 */
base64.test = function test(string) {
    return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(string);
};


/***/ }),
/* 14 */
/***/ (function(module, exports) {

/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) Feross Aboukhadijeh
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * 
 */
module.exports = function isBuffer(obj) {
  return obj != null && obj.constructor != null && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj);
};

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var utf8 = __webpack_require__(12);

function DeltaApplicationResult(data) {
  this.data = data;
}

DeltaApplicationResult.prototype.asUint8Array = function () {
  return this.data;
};

DeltaApplicationResult.prototype.asUtf8String = function () {
  return utf8.read(this.data, 0, this.data.length);
};

DeltaApplicationResult.prototype.asObject = function () {
  return JSON.parse(this.asUtf8String());
};

module.exports = DeltaApplicationResult;

/***/ })
/******/ ]);