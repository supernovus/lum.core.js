
const {S,F,TYPES:{COMPLEX},needType,needObj,def} = require('./types');

/**
 * @callback module:@lumjs/core~InitFunc 
 * @param {string} name - The `name` parameter passed to `lazy()`
 * @this {object} - The `obj` parameter passed to `lazy()`
 */

/**
 * Build a lazy initializer property.
 *
 * Basically the first time the property is accessed it's built.
 * Subsequent accesses will use the already built property.
 * This is an extension of the {@link def} method, and indeed an
 * alias called `def.lazy()` is also available.
 *
 * @param {Object} obj - The object to add the property to.
 * @param {string} name - The name of the property to add.
 * @param {module:@lumjs/core~InitFunc} initfunc 
 *   The function to initialize the property.
 * @param {*} [onset] How to handle assignment.
 * 
 *   If this is `true` then the new value will be assigned directly,
 *   skipping the initialization process entirely.
 * 
 *   If this is `false` then any attempt at assignment will throw
 *   a `ReferenceError` with a message indicating the property is read-only.
 * 
 *   If this is a `function` it will take two arguments, the
 *   first being the value that is trying to be assigned, and
 *   the second being the currently assigned value.
 *   As with any getter or setter, `this` will be the `obj` itself.
 *   The function must return the value to be assigned.
 *   If it returns `undefined`, then the value was not valid,
 *   and will not be assigned.
 * 
 *   If this is anything else, assignment will do nothing at all.
 * 
 * @param {Object} [desc={}] Descriptor rules for the property.
 *   We only support two descriptor rules with this function, and
 *   their default values are the same as the `def()` function.
 *   - `configurable` → `true`
 *   - `enumerable` → `false`
 *   Any other descriptor properties are invalid here.
 *
 * @return {Object} The object we defined the property on.
 * @alias module:@lumjs/core.lazy
 */
function lazy(obj, name, initfunc, onset, desc={})
{
  needType(COMPLEX, obj, 'obj must be an object');
  needType(S, name, 'name must be a string');
  needType(F, initfunc, 'initfunc must be a function');
  needObj(desc, 'desc parameter was not an object');

  let value;

  desc.get = function()
  {
    if (value === undefined)
    {
      value = initfunc.call(this, name);
    }
    return value;
  }

  if (onset === true)
  { // Allow direct assignment.
    desc.set = function(newval)
    {
      value = newval;
    }
  }
  else if (onset === false)
  { // Throw an error on assignment.
    desc.set = function()
    {
      throw new ReferenceError("The "+name+" property is read-only");
    }
  }
  else if (typeof onset === F)
  { // A proxy method for assignment.
    desc.set = function(newval)
    {
      const setval = onset.call(this, newval, value);
      if (setval !== undefined)
      {
        value = setval;
      }
    }
  }

  def(obj, name, desc);
}

// Gotta be one of the greatest lines...
def(def, 'lazy', lazy);

module.exports = lazy;