'use strict';

/**
 * Get both string and symbol keys from an object.
 * @param {object} obj - Target object.
 * @returns {(string|symbol)[]}
 */
const getOwnKeys = obj => [
  ...(Object.getOwnPropertyNames(obj)),
  ...(Object.getOwnPropertySymbols(obj)),
];

/**
 * See if an object has its own properties.
 */
const isEmptyObject = obj => getOwnKeys(obj).length === 0;

/**
 * Get the name of a property key.
 * @param {(string|symbol)} key - Property key.
 * 
 * If this is a string it will be returned as-is.
 * If this is a symbol then how it is formatted depends
 * on the options specified.
 * 
 * @param {object} [opts] Options for handling symbol property keys.
 * @param {string} [opts.prefix] Prefix character; default: `[`.
 * @param {string} [opts.suffix] Suffix character; default: `]`.
 * @param {boolean} [opts.toStr=false] Use toString method?
 * 
 * If this is false (default), then the return value will be the
 * `key.description` value with the prefix and suffix values applied.
 * 
 * If this is true then the prefix/suffix options are ignored,
 * and `key.toString()` will be used as the return value.
 * 
 * @returns {string}
 */
function keyName(key, opts={}) {
  if (typeof key === 'string') return key;
  if (typeof key === 'symbol') {
    if (opts.toStr) {
      return key.toString();
    }

    let pf = opts.prefix ?? '[';
    let sf = opts.suffix ?? ']';
    return pf+key.description+sf;
  }
  
  console.error({key, opts});
  throw new TypeError('Invalid key');
}

module.exports = {getOwnKeys, isEmptyObject, keyName}
