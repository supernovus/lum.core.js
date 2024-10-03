/**
 * Observable API
 * 
 * A set of common methods that can be applied to any object
 * to provide an API for observing events.
 * 
 * The original implementation (v1) was based on code from Riot.js.
 * The new implementation is a compatibility wrapper for the new
 * core {@link module:@lumjs/core/events events} module.
 * 
 * @typedef {object} module:@lumjs/core/observable~API
 */

/**
 * Assign an event handler.
 * 
 * @param {string} events - Event names (space-separated)
 * @param {function} fn - Callback function
 * @returns {object} `this`
 * @function module:@lumjs/core/observable~API.on
 */

/**
 * Removes previously assigned event listeners.
 * 
 * @param {string} events - Event names (space-separated)
 * @param {function} [fn] Callback function;
 * if omitted, removes *all* listeners for the specified events.
 * @returns {object} `this`
 * @function module:@lumjs/core/observable~API.off
 */

/**
 * Add an event handler that will be removed after it's called once.
 * 
 * @param {string} events - Event names (space-separated)
 * @param {function} fn - Callback function
 * @returns {object} `this`
 * @function module:@lumjs/core/observable~API.one
 */

/**
 * Execute all assigned listeners for the specified events.
 * Corresponds to the `emit()` method in the new events module.
 * 
 * @param {string} events - Event names (space-separated)
 * @returns {object} `this`
 * @function module:@lumjs/core/observable~API.trigger
 */
