/**
 * A simplistic event registration and dispatch module.
 * @module @lumjs/core/events
 * @deprecated Moved to @lumjs/events and @lumjs/events-observable packages.
 */
'use strict';

const Events = require('@lumjs/events');
const {lazy} = require('../obj/df');

exports = module.exports = Object.assign(
{
  /**
   * Apply the compatibility version of the observable API;
   * will load the events/observable sub-module on demand.
   * @name module:@lumjs/core/events.observable
   * @param {object} target
   * @param {object} [opts]
   * @returns {object} `target`
   * @deprecated Use the @lumjs/events-observable package.
   */
  observable(target, opts)
  {
    const {makeObservable} = exports.Observable;
    return makeObservable(target, opts);
  },
}, Events);

lazy(exports, 'Observable', () => require('./observable'));

/**
 * An Event object to emit to handler callbacks.
 * 
 * @class module:@lumjs/core/events.Event
 * 
 * @prop {module:@lumjs/core/events.Listener} eventListener
 * The event Listener instance this event was emitted from.
 * @prop {(string|Symbol)} type - The event type that was triggered.
 * @prop {string} name - The event name that was triggered;
 * if `type` is a string this will be the same value,
 * for a Symbol type this will be the `type.description` value.
 * @prop {object} target - Target object for this event.
 * @prop {Array} args - Arguments passed to `emit()`
 * @prop {object} options - Composes options from the
 * Registry and the Listener. Listener options take priority.
 * @prop {?object} data 
 * If `args[0]` is any kind of `object` other than another Event 
 * instance, it will be used as the `data` property. 
 * If `args[0]` is not an `object`, this property will be `null`.
 * @prop {module:@lumjs/core/events.Event} origEvent
 * Unless `this.prevEvent` is set, this should always be
 * a reference to `this` instance itself.
 * @prop {?module:@lumjs/core/events.Event} prevEvent
 * If `args[0]` is another Event instance this property
 * will be set with its value, as well as the following
 * changes to the default behavior:
 * 
 * - `this.data` will be set to `prevEvent.data`.
 * - `this.origEvent` will be set to `prevEvent.origEvent`
 * 
 * @prop {module:@lumjs/core/events~Status} emitStatus
 *
 * @deprecated Moved to @lumjs/events package.
 */

/**
 * An Event Listener instance used by a Registry
 * 
 * Used internally by the Registry class, there's likely very few 
 * reasons you'd want to call any methods on this manually.
 * 
 * @class module:@lumjs/core/events.Listener
 * 
 * @prop {module:@lumjs/core/events.Registry} registry 
 * The Registry instance this Listener belongs to.
 * @prop {(function|object)} handler - Event handler callback
 * @prop {Set} eventTypes - A set of all event types handled by this
 * @prop {Set} eventNames - Alias to `eventTypes`
 * @prop {object} options - Options specific to this listener.
 * 
 * @deprecated Moved to @lumjs/events package.
 */

/**
 * A class that handles events for target objects
 * 
 * @class module:@lumjs/core/events.Registry
 * 
 * @prop {module:@lumjs/core/events~GetTargets} getTargets 
 * A constructor-assigned callback method that returns a set of targets.
 * @prop {object} options - Registry-level options
 * @prop {Set.<module:@lumjs/core/events.Listener>} allListeners
 * All registered event listeners
 * @prop {Map.<string,Set.<module:@lumjs/core/events.Listener>>} listenersFor
 * Each key is a single event name, and the value is a Set of
 * listener objects that handle that event.
 * 
 * @deprecated Moved to @lumjs/events package.
 */

/**
 * A shortcut function to create a new Registry instance.
 * All arguments are passed to the Registry constructor.
 * @function module:@lumjs/core/events.register
 * @param {(object|module:@lumjs/core/events~GetTargets)} targets
 * @param {object} [opts]
 * @returns {object} A @lumjs/events.Registry instance.
 * @deprecated Moved to @lumjs/events package.
 */

/**
 * Create a registry for a single target object, then return the target.
 * @function module:@lumjs/core/events.extend
 * @param {object} target 
 * @param {object} [opts] 
 * @returns {object} `target`
 * @deprecated Moved to @lumjs/events package.
 */

/**
 * See if an object has a known trigger method.
 * @function module:@lumjs/core/events.hasTrigger
 * @param {object} obj - Object we want to find a trigger method on
 * @returns {?string} The name of the method found
 * @deprecated Moved to @lumjs/events package.
 */
