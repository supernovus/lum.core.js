const types = require('../types');
const {isComplex,isObj} = types;

/**
 * Get a property descriptor.
 * 
 * This is like `Object.getOwnPropertyDescriptor`, except that method
 * fails if the property is inhereted. This method will travel through
 * the entire prototype chain until it finds the descriptor.
 * 
 * @param {object|function} obj - Object to find a property in.
 * @param {string} prop - Name of the property we want the descriptor of.
 * @param {mixed} [defval] The fallback value if no descriptor is found.  
 * 
 * @returns {mixed} - The descriptor if found, `defval` if not.
 */
function getProperty(obj, prop, defval)
{
  if (!isComplex(obj)) throw new TypeError("Target must be an object or function");
  // Yeah it looks like an infinite loop, but it's not.
  while (true)
  {
    const desc = Object.getOwnPropertyDescriptor(obj, prop);
    if (isObj(desc))
    { // Found it.
      return desc;
    }

    // Didn't find it, so let's try the next object in the prototype chain.
    obj = Object.getPrototypeOf(obj);
    if (!isComplex(obj))
    { // We've gone as far up the prototype chain as we can, bye now!
      return defval;
    }
  }
}

module.exports = getProperty;
