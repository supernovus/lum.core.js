// Get the extended type list.
const TYPES = require('./typelist');
const {isObj, isArray, isTypedArray} = require('./basics');
const stacktrace = require('../meta').stacktrace;

const TOSTRING = [TYPES.F, TYPES.SY];

/**
 * Stringify a Javascript value.
 * 
 * We typically just use `JSON.stringify()` but that doesn't work on
 * some types. So this function adds string formats for:
 *  - `function`
 *  - `symbol`
 *  - `TypedArray`
 *  - `Map`
 *  - `Set`
 * I may add even more extended types in the future, but that's enough
 * for now.
 * 
 * This is NOT meant for serializing data, and does not use a JSON-friendly
 * output format. I'm writing a different library for that.
 * 
 * @param {*} what - The value to stringify.
 * @param {integer} [recurse=1] Recurse objects to this depth.
 * @param {boolean} [addNew=false] Use 'new Class()' instead of 'Class()'. 
 * @returns {string} The stringified value.
 * @alias module:@lumjs/core/types.stringify
 */
function stringify (what, recurse=1, addNew=false)
{
  const whatType = typeof what;
  if (TOSTRING.includes(whatType)) return what.toString();

  // A few formatting helpers used below.

  const classname = () => (addNew ? 'new ' : '') + what.constructor.name;
  const construct = val => `${classname()}(${val})`;
  const reconstruct = val => construct(stringify(val,recurse,addNew));
  const arrayish = vals => reconstruct(Array.from(vals));

  // Take an iterator from a Map/Set/etc and make a string for it.
  /*function arrayish(vals)
  { 
    const arrVal = stringify(Array.from(vals), recurse, addNew);
    return `${classname()}(${arrVal})`;
  }*/

  if (isTypedArray(what))
  { // This one is pretty simple.
    return construct(what.toString());
  }
  
  if (what instanceof Map)
  {
    return arrayish(what.entries());
  }
  
  if (what instanceof Set)
  {
    return arrayish(what.values());
  }
  
  if (recurse && isObj(what))
  { // Stringify all enumerable properties recursively.
    const out = isArray(what) ? [] : {};
    for (const key in what)
    {
      out[key] = stringify(what[key], recurse-1, addNew);
    }
    what = out;
  }

  // If we reached here, there's no special methods, use JSON.
  return JSON.stringify(what);
}

module.exports = stringify;
