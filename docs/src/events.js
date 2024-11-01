/**
 * Get a set of target objects dynamically.
 * @callback module:@lumjs/core/events~GetTargets
 * @this module:@lumjs/core/events.Registry
 * @param {module:@lumjs/core/events~Status} [status]
 * This will be a Status object if the callback was called from `emit()`.
 * If it was called from the Registry constructor, this will undefined.
 * @returns {Set|Array|Iterable} Target objects; `Set` is the preferred
 * return value, with `Array` as second choice.
 * 
 * Technically any kind of iterable object will work, but some functionality
 * will be limited or unavailable if it's not a `Set` or `Array`.
 */

/**
 * The specified handler used by an event Listener.
 * @typedef {(module:@lumjs/core/events~HandlerFn|module:@lumjs/core/events~HandlerObj)} module:@lumjs/core/events~Handler
 */

/**
 * An event handler callback function.
 * 
 * The value of `this` depends on the context:
 * - If the callback is the *handler*, `this` will be `event.target`
 * - If the callback is a `handleEvent()` method, `this` will be the
 *   {@link module:@lumjs/core/events~HandlerObj} object.
 * 
 * All assuming of course that the callback is not a closure or bound.
 *
 * @callback module:@lumjs/core/events~HandlerFn
 * @param {module:@lumjs/core/events.Event} event - The emitted event
 * @returns {void}
 */

/**
 * An event handler object instance
 * @typedef {object} module:@lumjs/core/events~HandlerObj
 * @prop {module:@lumjs/core/events~HandlerFn} handleEvent - Handler method
 */

/**
 * Emit process status info
 * @typedef {object} module:@lumjs/core/events~Status
 * @prop {Set.<string>} eventTypes - Event types being triggered
 * @prop {Set.<string>} eventNames - Alias of `eventTypes`
 * @prop {Set.<object>} targets - From `registry.getTargets()`
 * @prop {bool} multiMatch - `registry.options.multiMatch`
 * @prop {Set} onceRemoved - Any `Listener` that had the `once` rule set;
 * will be removed from this registry at the end of the emit process.
 * @prop {bool} stopEmitting - If an event changes this to `true`,
 * the emit process will end with no further events being emitted.
 * @prop {module:@lumjs/core/events.Event[]} emitted - Emitted events;
 * added after each new Event is emitted from the Listener.
 * @prop {Set.<module:@lumjs/core/events.Listener>} [targetListeners]
 * A set of Listener instances that have already been seen for the
 * current target. This property only exists in the status object as
 * it's being used to emit Event objects (so is available to handler
 * callbacks), but NOT in the final status object returned by `emit()`.
 * @prop {module:@lumjs/core/events.Registry} registry 
 */

/**
 * Callback when unregistering a target
 * @callback module:@lumjs/core/events~UnregisterFn
 * @this module:@lumjs/core/events.Registry
 * @param {object} target - The target object being unregistered
 * @param {object} pmap - TODO: document schema
 * @param {module:@lumjs/core/events.Registry} `this`
 * @returns {void} 
 */

/**
 * Setup function for Event objects
 * @callback module:@lumjs/core/events~SetupEvent
 * @this module:@lumjs/core/events.Listener
 * @param {module:@lumjs/core/events.Event}
 * @returns {void}
 */

/**
 * Setup function for Listener instances
 * @callback module:@lumjs/core/events~SetupListener
 * @this module:@lumjs/core/events.Registry
 * @param {module:@lumjs/core/events.Listener}
 * @returns {void}
 */
