const def = require('./def');
const {S,F} = require('./js');
const {COMPLEX} = require('./typelist');
const {needType,needObj} = require('./needs');
const {doesDescriptor} = require('./basics');

/**
 * Metadata for the property definition.
 * 
 * @typedef module:@lumjs/core/types~LazyDef
 * @property {string} name - The `name` passed to `lazy()`
 * @property {(object|function)} target - The `target` passed to `lazy()`
 * @property {object} opts - The `opts` passed to `lazy()`
 * @property {object} arguments - The full `arguments` passed to `lazy()`
 * 
 * @property {boolean} [assign] Override default assignment rules?
 * 
 * This property may be added by the `LazyGetter` or `LazySetter` 
 * functions to override the default assignment rules. 
 * 
 * If this is `true` the return value will be assigned, replacing the 
 * lazy accessor property, even if the value is `undefined`.
 * 
 * If this is `false`, the value will be returned, but will **not** be 
 * *assigned*, so the lazy accessor property will remain.
 * 
 * Leave it `undefined` to use the default assignment behaviour.
 * 
 * @property {*} [def] Special options for `def()`
 * 
 * The [def()]{@link module:@lumjs/core/types.def} function has an
 * optional fourth parameter called `opts` which is used for a few
 * specialized purposes. If this property is set, it will be used as
 * the value for `opts` when assigning the return value to the property.
 * 
 * Leave it `undefined` to use the default `def()` behaviour.
 * 
 */

/**
 * A function to generate the property value.
 * 
 * @callback module:@lumjs/core/types~LazyGetter 
 * @param {module:@lumjs/core/types~LazyDef} info - A metadata object
 * @returns {*} The generated *value* of the property
 * 
 * By default if this is `undefined` the value will **not** be
 * assigned, and instead the accessor property will remain in
 * place to be used on subsequent calls until a value other than
 * `undefined` is returned.
 * 
 * This assignment behaviour can be overridden by the function
 * if it sets `this.assign` to an explicit boolean value.
 * 
 * As we are using [def()]{@link module:@lumjs/core/types.def} 
 * to assign the value, by default if the return value appears 
 * to be a valid *Descriptor* object, it will be used as the 
 * property descriptor. See `def()` for further details on how
 * it handles the various arguments.
 * 
 * Regardless of the value of `this.assign`, this value will
 * be *returned* as the property value.
 * 
 * @this {module:@lumjs/core/types~LazyDef} The `info` metadata object
 */

/**
 * A function to handle attempts at assignment.
 * 
 * Very similar to [LazyGetter]{@link module:@lumjs/core/types~LazyGetter}
 * but called when property assignment is attempted on the
 * lazy accessor property.
 * 
 * If you explicitly want to forbid assignment, you can throw
 * an `Error` from this function.
 * 
 * @callback module:@lumjs/core/types~LazySetter
 * @param {*} value - The value attempting to be assigned.
 * @returns {*} The *actual* assignment value (if any.)
 * 
 * The same assignment rules apply as in the
 * [LazyGetter]{@link module:@lumjs/core/types~LazyGetter}
 * callback.
 * 
 * @this {module:@lumjs/core/types~LazyDef} A metadata object.
 */

/**
 * Build a lazy initializer property.
 * 
 * This builds an *accessor* property that will replace itself
 * with a initialized property, the value of which is obtained from
 * a supplied initialization function. Any subsequent use of the
 * property will obviously be using the initialized property directly.
 * 
 * The general purpose is if there is a property that requires
 * a fairly intensive load time, or requires a large library that
 * you may not always *need* for basic things, you can use this
 * to ensure that the property is only initialized when needed.
 * 
 * This is an extension of the [def()]{@link module:@lumjs/core/types.def} 
 * method, and indeed an alias called `def.lazy()` is also available.
 * 
 * IMPORTANT: In a later v1.18.x release, this will be refactored to use the
 * [obj.df()]{@link module:@lumjs/core/obj.df} function that will replace
 * def(). There's already an alias called `df.lazy()` available now.
 * This will also be moved to the `obj` module, with a deprecated alias left
 * in the `types` module for the duration of the 1.x lifecycle.
 *
 * @param {(object|function)} target - The object to add the property to.
 * 
 * As with `def()` itself, this can be either an `object` or `function`,
 * as in Javascript the latter is an extension of the former.
 * 
 * @param {string} name - The name of the property to add.
 * 
 * @param {module:@lumjs/core/types~LazyGetter} initfunc 
 * The function to initialize the property.
 * 
 * This will normally only ever be called the first time the property
 * is accessed in a *read* operation. The return value from this
 * will be assigned to the property using `def()`, replacing the
 * lazy accessor property.
 * 
 * @param {object} [opts] Options to customize behavior.
 * 
 * @param {module:@lumjs/core/types~LazySetter} [opts.set]
 * A function to handle assignment attempts.
 * 
 * This obviously only applies to the *lazy accessor* property,
 * and will have no affect once the property has been replaced
 * by its initialized value.
 * 
 * @param {boolean} [opts.enumerable=false] Is the property enumerable?
 * 
 * This applies to the *lazy accessor* property only.
 * You can set custom descriptor rules in the `initfunc`
 * if you need them on the initialized property.
 * 
 * @param {?boolean} [opts.assign] The *default* value for the `assign` property
 * in the [LazyDef]{@link module:@lumjs/core/types~LazyDef} object.
 * 
 * @param {*} [opts.def] The *default* value for the `def` property in
 * the [LazyDef]{@link module:@lumjs/core/types~LazyDef} object.
 *
 * @returns {(object|function)} The `target` argument
 * 
 * @alias module:@lumjs/core/types.lazy
 */
function lazy(target, name, initfunc, opts={})
{
  needType(COMPLEX, target, 'obj must be an object');
  needType(S, name, 'name must be a string');
  needType(F, initfunc, 'initfunc must be a function');
  needObj(opts, 'opts parameter was not an object');

  // The `this` object for the functions.
  const context = 
  { 
    name, 
    target, 
    opts, 
    arguments,
    assign: opts.assign,
    def: opts.def,
  }

  // The descriptor for the lazy accessor.
  const desc = 
  {
    configurable: true, 
    enumerable: opts.enumerable ?? false,
  };

  // Replace the property if rules are correct.
  const defval = function(value)
  {
    const assign = (context.assign ?? value !== undefined);
    if (assign)
    { // Replace the lazy accessor with the returned value.
      def(target, name, value, context.def);
      // Now return the newly assigned value.
      return target[name];
    }
    else if (doesDescriptor(value))
    { // A descriptor was returned, extract the real value.
      if (typeof value.get === F)
      {
        return value.get();
      }
      else 
      {
        return value.value;
      }
    }
    else 
    { // Just return the original value.
      return value;
    }
  }

  desc.get = function()
  { 
    return defval(initfunc.call(context,context));
  }

  if (typeof opts.set === F)
  { // We want to assign a lazy setter as well.
    desc.set = function(value)
    {
      defval(opts.set.call(context, value));
    }
  }

  // Assign the lazy accessor property.
  return def(target, name, desc);
}

// Gotta be one of the greatest lines...
def(def, 'lazy', lazy);

// And this is a close second...
def(lazy, 'def', def);

module.exports = lazy;
