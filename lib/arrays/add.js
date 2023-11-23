
const {N,def} = require('../types');

/**
 * Functions for adding values to arrays in different ways.
 * @alias module:@lumjs/core/arrays.add
 */
const ArrayAdd = module.exports = exports =
{
  prepend, before, append, after, insert,
}

function _addWith(array, oldValue, newValue, ifMissing, fn)
{
  let pos = array.indexOf(oldValue);

  if (pos === -1)
  {
    if (typeof ifMissing === N)
    {
      pos = ifMissing;
    }
    else
    {
      return false;
    }
  }

  return fn(array, newValue, pos);
}

/**
 * Prepend a value to an array.
 * 
 * @param {Array} array - Array to add the value to.
 * @param {*}     value - Value to add to the array.
 * @param {number} [pos=0] Position to prepend at.
 * 
 * If `pos` is `0` then `array.unshift(value)` is used.
 * Otherwise `array.splice(pos, 0, value)` is used.
 * 
 * @returns {Array} `array`
 * @alias module:@lumjs/core/arrays.add.prepend
 */
function prepend(array, value, pos=0)
{
  if (pos === 0)
  {
    array.unshift(value);
  }
  else
  {
    array.splice(pos, 0, value);
  }

  return array;
}

/**
 * Append a value to an array.
 * 
 * @param {Array} array - Array to add the value to.
 * @param {*}     value - Value to add to the array.
 * @param {number} [pos=-1] Position to append at.
 * 
 * If `pos` is `-1` then `array.push(value)` is used.
 * Otherwise `array.splice(pos+1, 0, value)` is used.
 * 
 * @returns {Array} `array`
 * @alias module:@lumjs/core/arrays.add.append
 */
function append(array, value, pos=-1)
{
  if (pos === -1)
  {
    array.push(value);
  }
  else
  {
    array.splice(pos+1, 0, value);
  }

  return array;
}

/**
 * Add a value to an array _before_ an existing value.
 * 
 * This uses `prepend()` to add the value.
 * 
 * @param {Array} array - Array to add the value to.
 * @param {*} oldValue  - Existing value to find.
 * @param {*} newValue  - Value to add to the array.
 * @param {(number|false)} [ifMissing=0] If `oldValue` is not found.
 * 
 * If this is a `number` it will be used as the `pos` argument.
 * 
 * If this is `false` the function will not add the value at all,
 * but will return `false` instead.
 * 
 * @returns {(Array|false)} Usually the input `array`; but will return
 * `false` if `ifMissing` was `false` and the `oldValue` was not found.
 * 
 * @alias module:@lumjs/core/arrays.add.before
 */
function before(array, oldValue, newValue, ifMissing=0)
{
  return _addWith(array, oldValue, newValue, ifMissing, prepend);
}

/**
 * Add a value to an array _after_ an existing value.
 * 
 * This uses `append()` to add the value.
 * 
 * @param {Array} array - Array to add the value to.
 * @param {*} oldValue  - Existing value to find.
 * @param {*} newValue  - Value to add to the array.
 * @param {(number|false)} [ifMissing=-1] If `oldValue` is not found.
 * 
 * If this is a `number` it will be used as the `pos` argument.
 * 
 * If this is `false` the function will not add the value at all,
 * but will return `false` instead.
 * 
 * @returns {(Array|false)} Usually the input `array`; but will return
 * `false` if `ifMissing` was `false` and the `oldValue` was not found.
 * 
 * @alias module:@lumjs/core/arrays.add.after
 */
function after(array, oldValue, newValue, ifMissing=-1)
{
  return _addWith(array, oldValue, newValue, ifMissing, append);
}

/**
 * Insert a value to an array using special logic.
 * 
 * See the `pos` argument for the positioning logic used.
 * 
 * @param {Array} array - Array to add the value to.
 * @param {*}     value - Value to add to the array.
 * @param {number} [pos=-1] Position to insert at.
 * 
 * If `pos` is less than `0` this uses `append()`;
 * Otherwise it uses `prepend()`.
 *
 * @returns {Array} `array`
 * @alias module:@lumjs/core/arrays.add.insert
 */
function insert(array, value, pos=-1)
{
  if (pos < 0)
  {
    return append(array, value, pos);
  }
  else
  {
    return prepend(array, value, pos);
  }
}

/**
 * A wrapper class to provide helper methods to Arrays.
 * 
 * Provides wrapped versions of `prepend()`, `append()`, 
 * `before()`, `after()`, and `insert()`.
 * 
 * The methods obviously pass the array argument, so remove it from
 * the argument signature when using the wrapper method. Other than that,
 * the rest of the arguments are the same as the wrapped functions.
 * 
 * @alias module:@lumjs/core/arrays.add.At
 */
class ArrayAt
{
  /**
   * Build a wrapper around an array.
   * 
   * @param {Array} array - Array to wrap.
   */
  constructor(array)
  {
    this.array = array;
  }

  /**
   * Add wrappers for the helper functions to the Array directly.
   * 
   * WARNING: This is monkey patching the array object instance.
   * If you're okay with that, cool. 
   * 
   * Otherwise, use a new `ArrayAt` object instance instead.
   * 
   * @param {Array} array - Array to add methods to.
   * 
   * @returns {Array} The input `array`
   */
  static extend(array)
  {
    for (const methName in ArrayAdd)
    {
      const methFunc = ArrayAdd[methName];
      def(array, methName, methFunc.bind(array, array));
    }
    return array;
  }

  /**
   * A static method that calls `new ArrayAt(array)`;
   * 
   * @param {Array} array - Array to wrap
   * @returns {module:@lumjs/core/arrays.ArrayAt} A new instance.
   */
  static new(array)
  {
    return new this(array);
  }

} // ArrayAt class

// Set up ArrayAt methods, and export the functions.
for (const methName in ArrayAdd)
{
  const methFunc = ArrayAdd[methName];

  def(ArrayAt.prototype, methName, function()
  {
    methFunc(this.array, ...arguments);
  });
}

def(ArrayAdd, 'At', ArrayAt);
