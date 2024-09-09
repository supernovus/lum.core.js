"use strict";

const {F,isObj} = require('../types');
const Event = require('./event');

const REMOVE_OPTS = ['listener','handler','eventNames'];

function makeOpts(spec)
{
  const opts = Object.assign({}, spec, spec.options);
  for (const rm of REMOVE_OPTS)
  {
    delete opts[rm];
  }
  return opts;
}

/**
 * Is something a valid value for an event listener?
 * 
 * Valid listener values are inspired by the `DOM.EventTarget` interface:
 * 
 * - A `function`
 * - An `object` with a `handleEvent()` method
 * 
 * @param {*} v - Value we are testing
 * @returns {boolean}
 * @alias module:@lumjs/core/events.Listener.isListener
 */
function isListener(v)
{
  return (typeof v === F || (isObj(v) && typeof v.handleEvent === F));
}

/**
 * An Event Listener instance used by a Registry
 * 
 * Used internally by the Registry class, there's likely very few 
 * reasons you'd want to call any methods on this manually.
 * 
 * @prop {module:@lumjs/core/events.Registry} registry 
 * The Registry instance this Listener belongs to.
 * @prop {(function|object)} handler - Event handler callback
 * @prop {Set} eventNames - A set of all event names handled by this
 * @prop {object} options - Options specific to this listener.
 * 
 * See {@link module:@lumjs/core/events.Registry#makeListener makeListener()}
 * for details on what this may contain and how it is populated.
 * 
 * @alias module:@lumjs/core/events.Listener
 */
class LumEventListener
{
  /**
   * Build a listener; called by Registry instance
   * @private
   * @param {module:@lumjs/core/events.Registry} registry 
   * @param {object} spec 
   */
  constructor(registry, spec)
  {
    if (isListener(spec.listener))
    {
      this.handler = spec.listener;
    }
    else if (isListener(spec.handler))
    {
      this.handler = spec.handler;
    }
    else
    {
      console.error({spec,registry});
      throw new TypeError("Invalid listener/handler in spec");
    }
    
    // Assign the rest here.
    this.registry = registry;
    this.options = makeOpts(spec);
    this.eventNames = registry.getEventNames(spec.eventNames);
  }

  /**
   * See if there is at least one item in `this.eventNames`
   * @type {boolean}
   */
  get hasEvents()
  {
    return this.eventNames.size > 0;
  }

  /**
   * Used by {@link module:@lumjs/core/events.Registry#emit emit()} to create
   * and emit a new Event instance for a specified event name and target.
   * 
   * This is a *protected method* and should not be called directly.
   * @protected
   * @param {string} eventName - A single event name that was triggered
   * @param {object} target    - A single target object
   * @param {Array}  args      - Arguments passed to `emit()`
   * @param {module:@lumjs/core/events~Status} status - Emit status info
   * @returns {module:@lumjs/core/events.Event} The new Event that was emitted
   */
  emitEvent(eventName, target, args, status)
  {
    const event = new Event(this, target, eventName, args, status);

    if (typeof this.handler === F)
    { // The simplest is the good old function
      this.handler.call(event.target, event);
    }
    else
    { // An object with a `handleEvent()` method
      this.handler.handleEvent(event);
    }

    if (event.options.once)
    { // This listener is to be removed
      status.onceRemoved.add(this);
    }

    return event;
  }

}

LumEventListener.isListener = isListener;
module.exports = LumEventListener;