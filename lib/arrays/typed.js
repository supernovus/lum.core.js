'use strict';

const {F, isObj, isPlainObject} = require('../types/basics');
const Enum = require('../enum');
const TypedArray = Object.getPrototypeOf(Int8Array);
const CT = Enum(['GT','LT','ALL'], {flags: true});

/**
 * An Enum object with bitwise flags for the `opts.convert` argument
 * of the makeType() function.
 * 
 * @name module:@lumjs/core/arrays.ConvertType
 * @type {object}
 * @prop {number} GT - Convert any values which have a larger bytes per 
 *   element size than the `opts.type` TypedArray class.
 * @prop {number} LT - Convert any values which have a smaller bytes per 
 *   element size than the `opts.type` TypedArray class.
 * @prop {number} ALL - Convert all values that aren't already instances
 *   of the `opts.type` class.
 *   Note: if you use this flag, then the other flags are ignored!
 *
 */

/**
 * Build a new TypedArray with multiple input values.
 * 
 * @alias module:@lumjs/core/arrays.makeTyped
 * 
 * @param {(object|function)} [opts] - Options.
 * 
 * If this is a `function` then it is assumed to be the `opts.type` value.
 * 
 * If this is anything other than a _plain object_ (i.e. it was created
 * with a class constructor rather than `{}` literal syntax), then it will
 * be considered an element of the `inValues` parameter instead of options.
 * 
 * @param {function} [opts.type=Uint8Array] TypedArray class to return.
 * @param {number}   [opts.convert=0]       Convert TypedArrays before merge?
 * 
 * By default all TypedArray objects passed (or created by the TextEncoder) 
 * will be added to the new TypedArray as-is, which may result in data 
 * corruption if the unit byte-size of the source TypeArray is larger 
 * than the newly created TypeArray. If the unit byte-size of the requested
 * type is the same or larger than any input sources, then it doesn't matter.
 * 
 * You can however convert all source TypedArray objects to the `opts.type`
 * class using an intermediary ArrayBuffer, and choose the criteria for
 * the conversion by specifying various bitwise flags in this option.
 * 
 * Use the properties of the `ConvertType` Enum as the flag values.
 * 
 * e.g.: `makeTyped({convert: ConvertType.GT | ConvertType.LT}, ...values);`
 * 
 * WARNING: The type conversion methodology is not the greatest and doesn't
 * cover every possible issue, so don't be surprised if you end up with
 * corrupted data (or you have an Exception thrown) when mixing different
 * TypeArray classes. If at all possible, only merge values of the same type.
 * 
 * @param {...mixed} inValues - Values to be added to the new TypeArray.
 * 
 * If the value is considered a _View_ (i.e. a TypedArray or DataView),
 * it will be used directly.
 * 
 * Any other kind of `object` will be serialized using JSON and then
 * encoded into a Uint8Array using TextEncoder.
 * 
 * Any other type of value will be encoded using TextEncoder, which will
 * call `value.toString()` on any non-string values before encoding.
 * 
 * @returns {TypedArray}
 * 
 * @throws {TypeError} If `opts.type` is not a TypedArray constructor.
 * @throws {RangeError} If the byte length of any of the `inValues`
 *   is not an integral multiple of the `opts.type` bytes per element size.
 * 
 */
function makeTyped(opts, ...inValues) 
{
  if (typeof opts === F) 
  {
    opts = {type: opts};
  }
  else if (isPlainObject(opts)) 
  {
    inValues.unshift(opts);
    opts = {};
  }

  let wantType = opts.type    ?? Uint8Array;
  let convert  = opts.convert ?? 0;

  if (typeof wantType !== F || !TypedArray.isPrototypeOf(wantType))
  {
    console.error({wantType, opts, inValues});
    throw new TypeError("Invalid TypedArray class");
  }

  let fullLen = 0;
  let tenc = new TextEncoder();
  let wantSize = wantType.BYTES_PER_ELEMENT;

  let mergeValues = inValues.map(value => 
  {
    if (!ArrayBuffer.isView(value)) 
    {
      if (isObj(value)) 
      {
        value = JSON.stringify(value);
      }
      value = tenc.encode(value); 
    }

    let valSize = value.constructor.BYTES_PER_ELEMENT;

    if ( ((convert & CT.ALL) && !(value instanceof wantType))
      || ((convert & CT.GT)  && valSize > wantSize) 
      || ((convert & CT.LT)  && valSize < wantSize)) 
    { // Convert value to our wanted type
      value = new wantType(value.buffer);
    }

    fullLen += value.byteLength;

    return value;
  });

  let output = new wantType(new ArrayBuffer(fullLen));
  let offset = 0;

  for (let value of mergeValues) 
  {
    output.set(value, offset);
    offset += value.length;
  }

  return output;
}

module.exports = {makeTyped, ConvertType: CT, TypedArray}
