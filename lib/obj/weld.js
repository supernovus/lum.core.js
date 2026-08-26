'use strict';

/**
 * Defaults for the obj.weld() function.
 * @namespace module:@lumjs/core/obj.Weld
 */
const Weld = {};

const { isObj } = require('../types/basics');

/**
 * Default updates to apply to *accessor* properties: 
 * `{ configurable: false }`
 * @alias module:@lumjs/core/obj.Weld.UPDATE_GET
 */
Weld.UPDATE_GET = Object.freeze({ configurable: false });

/**
 * Default updates to apply to *data value* properties:
 * `{ configurable: false, writable: false }`
 * @alias module:@lumjs/core/obj.Weld.UPDATE_VAL
 */
Weld.UPDATE_VAL = Object.freeze({ configurable: false, writable: false });

/**
 * Default handler for weld() function.
 * 
 * Ever want to lock/seal/freeze existing properties without preventing new
 * properties from being added? That's what this handler does.
 * 
 * It uses `Weld.UPDATE_VAL` on *data value* properties, 
 * and `Weld.UPDATE_GET` on *accessor* properties (if they are enabled).
 * 
 * You can call this from your custom handler functions after applying any
 * of your own tests to further filter properties.
 * 
 * Also aliased as: `obj.weld.handle`
 * 
 * @alias module:@lumjs/core/obj.Weld.defaultHandler
 * @type {module:@lumjs/core/obj~Welder}
 * @param {(symbol|string)} key
 * @param {object} desc
 * @param {object} opts - Options; below are ones specific to this handler.
 * @param {boolean} [opts.accessors=false] Update accessor properties?
 * 
 * If false (the default), only descriptors with a `value` will be updated.
 * 
 * If true, property descriptors with a `get` function will also be updated.
 * A `set` function is _optional_, and is not part of this test at all.
 * 
 * @param {boolean} [opts.enumerable=true] Only update enumerable properties?
 * 
 * If true (the default), only enumerable properties will be updated.
 * You can set this to false to allow non-enumerable properties as well.
 * 
 * @returns {?object} Updates to apply; null if property is not applicable.
 * @example
 * // Calling the default from a custom handler.
 * weld(obj, {
 *   accessors: true, // Update accessor properties as well.
 *   handle(k,d,o) {
 *     // Skip symbols, empty string key, and keys starting with `_`.
 *     if (!k || typeof k === 'symbol' || k[0] === '_') return null;
 *     // Now use the default handler to handle the descriptor.
 *     return weld.handle(k,d,o);
 *   },
 * });
 */
function defaultWelder(key, desc, opts) {
  if ((opts.enumerable ?? true) && !desc.enumerable) return null;

  if (desc.value !== undefined) {
    return Weld.UPDATE_VAL;
  }

  if (opts.accessors && (typeof desc.get === 'function')) {
    return Weld.UPDATE_GET;
  }

  return null;
}

Weld.defaultHandler = defaultWelder;

/**
 * Update property descriptors using a handler function.
 * 
 * The default behaviour with no options will make all enumerable
 * non-accessor properties completely read-only and non-configurable.
 * 
 * Properties that are NOT _configurable_ will always be skipped,
 * and will never be passed to the handler function.
 * 
 * @alias module:@lumjs/core/obj.weld
 * @param {(object|function)} target - The target to modify.
 * @param {(object|module:@lumjs/core/obj~Welder)} [opts] Options.
 * 
 * If you pass a function here, it will be used as `opts.handle`.
 * 
 * Handler functions may also support their own named options, see
 * {@link module:@lumjs/core/obj.Weld.defaultHandler} for the ones
 * supported by the default handler.
 * 
 * @param {module:@lumjs/core/obj~Welder} [opts.handle] Property Handler;
 * if not specified, `obj.Weld.defaultHandler` will be used.
 * @returns {object} The `obj` after updating the property descriptors.
 * @throws {TypeError} If either argument is an invalid value.
 */
function weld(target, opts = {}) {
  if (typeof opts === 'function') {
    opts = { handle: opts }
  }
  else if (!isObj(opts)) {
    console.error('weld()', { opts, target });
    throw new TypeError('Invalid opts argument');
  }

  let descs = Object.getOwnPropertyDescriptors(target);
  let handle = (typeof opts.handle === 'function')
    ? opts.handle
    : defaultWelder;
  let keys = Reflect.ownKeys(descs);

  for (let key of keys) {
    let desc = descs[key];
    if (!desc.configurable) continue;   // Non-configurable

    let update = handle(desc, key, opts);
    if (!isObj(update)) continue;

    Object.assign(desc, update);
    Object.defineProperty(target, key, desc);
  }

  return target;
}

Object.defineProperty(weld, 'handle', { value: defaultWelder });
Object.freeze(Weld);

module.exports = { weld, Weld };

/**
 * A weld() handler to determine property descriptor updates to apply.
 * @callback module:@lumjs/core/obj~Welder
 * @param {(string|symbol)} key - Property key.
 * @param {object} desc - Property descriptor.
 * @param {object} opts - Options from weld().
 * @returns {?object} Updates to apply to descriptor;
 * return null if the property is not applicable.
 */
