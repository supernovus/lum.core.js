/* Additional documentation for `env` module. */

/**
 * Get a raw string value (low-level);
 * Use get() instead of this.
 * @protected
 * @function module:@lumjs/core/env.getStr
 * @param {key} - Key to get.
 * @returns {(string|undefined)}
 */

/**
 * Set a raw string value (low-level);
 * Use set() instead of this.
 * @protected 
 * @function module:@lumjs/core/env.setStr
 * @param {string} key - Key to set.
 * @param {string} value - Value to set.
 * @returns {object} this module.
 */

/**
 * Context info for value handlers.
 * 
 * More properties may exist in some cases. 
 * 
 * @typedef {object} module:@lumjs/core/env~ContextInfo
 * @prop {string} key - Key the value is associated with.
 * @prop {object} opts - Compiled get() or set() options.
 * @prop {object} env - The Env module object itself.
 * 
 * @prop {(undefined|object)} json - JSON metadata.
 * 
 * Most of the `json` options are only used on `opts.revive`
 * and `opts.replace` callbacks, when `opts.wrapJSON` is true.
 * 
 * In almost all other cases this should be undefined.
 * 
 * @prop {string} json.key - Key passed to JSON reviver/replacer.
 * @prop {(object|undefined)} json.ctx - JSON reviver context.
 * See JSON.parse() for information about this.
 * @prop {object} json.target - The `this` value in reviver/replacer.
 * @prop {(Error|undefined)} error - Error encountered (if applicable).
 */

/**
 * Value Handler.
 * @callback module:@lumjs/core/env~ValueHandler
 * @param {string} val - Value that may require conversion.
 * @param {module:@lumjs/core/env~ContextInfo} info - Context info. 
 * @this module:@lumjs/core/env~ContextInfo
 * @returns {mixed} Value after any applicable conversion(s).
 * 
 * Unhandled values should be returned as-is.
 * 
 * If the return value is NOT a string, the built-in JSON data value
 * detector and decoder will not be used.
 */

/**
 * Result from set() method.
 * @typedef {module:@lumjs/core/env~ContextInfo} module:@lumjs/core/env~SetInfo
 * @prop {boolean} ok - Did the set operation succeed?
 * @prop {(string|null|undefined)} json - JSON string (if applicable).
 * - Will be undefined if the value was not an object.
 * - Will be null if JSON.stringify() threw an error.
 * - Will be a string if value was an object and JSON.stringify() worked.
 * @prop {mixed} value - The value argument.
 */

/**
 * Storage item callback function.
 * 
 * Used by forEach(), withEach(), getMap(), and getProps().
 * 
 * @callback module:@lumjs/core/env~ItemCallback
 * @param {module:@lumjs/core/env~CallbackItem} item - Callback Item.
 * @returns {mixed} The return value from the callback.
 * @this {module:@lumjs/core/env}
 */

/**
 * Callback Item - passed to callback storage item callback functions.
 * @typedef {object} module:@lumjs/core/env~CallbackItem
 * @prop {string} key - Key
 * @prop {mixed} value - Value; a lazy-loaded property.
 * 
 * When the item object is initially created this is a getter that
 * will call `this.get(key, opts)` when accessed the first time.
 * The return value from the getter will be assigned to this property
 * so any subsequent use of the property will be on the actual value.
 * 
 * @prop {object} opts - Compiled options for the current forEach() call.
 * 
 * The forEach() method (and its various siblings) will create a new 
 * object that composes any options passed to it with the default get()
 * options, and then will use that single object as this property value
 * on every item object passed to the callback(s).
 * 
 * @prop {object} info - Metadata about the current process.
 * 
 * Is also available as the special `opts[env.Metadata]` property if needed
 * in a value handler for whatever reason.
 * 
 * @prop {module:@lumjs/core/env~CallbackItemLog} info.prevItem - Previous log
 * from a forEach() callback, which are called once per item in storage.
 * 
 * This includes the implicit top-level callback used by withEach() to call
 * all of the child callbacks on each item.
 * 
 * @prop {module:@lumjs/core/env~CallbackItemLog} info.prevCall - Previous log
 * from a withEach() child callback. 
 * 
 * Also applicable to the optional filter callbacks supported by getMap()
 * and getProps() as those are simply wrappers around the withEach() method.
 * 
 * @prop {module:@lumjs/core/env~CallbackItemLog} info.status - Current info.
 * 
 * This will become the `prevItem` or `prevCall` object for the next iteration.
 * Will be removed from the metadata when the forEach() operation completes.
 *
 * @prop {module:@lumjs/core/env} env - The env module object itself.
 */

/**
 * Info about a specific forEach() or withEach() iteration.
 * May have additional properties added by callbacks/handlers.
 * @typedef {object} module:@lumjs/core/env~CallbackItemLog
 * @prop {module:@lumjs/core/env~CallbackItem} item
 * @prop {module:@lumjs/core/env~ItemCallback} cb
 * @prop {mixed} retval - The return value from `cb(item, opts)`.
 */
