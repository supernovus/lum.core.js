// Get the extended type list.
const TYPES = require('./typelist');
const {isObj, isArray, isTypedArray} = require('./basics');
const def = require('./def');

const TOSTRING_TYPES = [TYPES.F, TYPES.SY];
const TOSTRING_INSTANCES = [RegExp];
const CUSTOM = [];

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
 *  - `Error`
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

  for (const test of CUSTOM)
  { // If there are custom extensions, we check them first.
    const ret = test.call({stringify}, what, recurse, addNew);
    if (typeof ret === TYPES.S)
    { // The extension processed the item.
      return ret;
    }
  }

  // A few types we simply stringify right now.
  if (TOSTRING_TYPES.includes(whatType)) return what.toString();

  if (isObj(what))
  { // We support a few kinds of objects.

    // Any class instance that we can simply call `toString()` on, let's do that.
    for (const aClass of TOSTRING_INSTANCES)
    {
      if (what instanceof aClass)
      {
        return what.toString();
      }
    }

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

    if (what instanceof Error)
    {
      return `${what.name}(${JSON.stringify(what.message)})`;
    }
    
    if (recurse)
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

  } // if isObj
  
  // If we reached here, there's no special methods, use JSON.
  return JSON.stringify(what);
}

// Add a custom extension.
def(stringify, '$extend',
function(func, registration=false)
{
  if (typeof func === TYPES.F)
  {
    if (registration)
    { // Using the function to register custom behaviour.
      func.call({stringify, TOSTRING_INSTANCES, TOSTRING_TYPES}, CUSTOM);
    }
    else 
    { // The function is a custom test.
      CUSTOM.push(func);
    }
  }
});

// Export it.
module.exports = stringify;
