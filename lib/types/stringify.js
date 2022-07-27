// Get the extended type list.
const TYPES = require('./typelist');
const {isObj, isArray, isTypedArray} = require('./basics');

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
  { // Recursion mode enabled.
    let out = '';
    if (isArray(what))
    { // Stringify an array.
      out = '[';
      out += what.map(item => stringify(item, recurse-1, addNew)).join(',');
      out += ']';
    }
    else
    { // Stringify a plain object.
      out = '{';
      function add(key, pre='')
      {
        out += `${pre}${key}:${stringify(what[key], recurse-1, addNew)}`
      }
      const keys = Object.keys(what);
      //console.debug("keys!", keys);
      if (keys.length > 0)
      { // Let's add the first key, then all subsequent keys.
        add(keys.shift());    
        for (const key of keys)
        {
          add(key, ',');
        }
      }
      out += '}';
    }
    return out;
  }
  else
  { // If we reached here, there's no special methods, use JSON.
    return JSON.stringify(what);
  }
}

module.exports = stringify;
