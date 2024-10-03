/**
 * A simplistic event registration and dispatch module.
 * 
 * Designed to be a replacement for the `observable` API which started
 * out simple enough (when I forked it from `riot.js`), but has since 
 * grown into a big mess with many unusual and unexpected behaviours.
 * 
 * So this has been designed to work with a cleaner, more consistent,
 * yet extremely flexible event model.
 * 
 * @module @lumjs/core/events
 */

const lazy = require('../types/lazy');

exports = module.exports =
{
  Registry: require('./registry'),
  Listener: require('./listener'),
  Event: require('./event'),

  /**
   * A shortcut function to create a new Registry instance.
   * All arguments are passed to the Registry constructor.
   * @param {(object|module:@lumjs/core/events~GetTargets)} targets
   * @param {object} [opts]
   * @returns {module:@lumjs/core/events.Registry}
   */
  register(targets, opts)
  {
    return new exports.Registry(targets, opts);
  },

  /**
   * Create a registry for a single target object, then return the target.
   * @param {object} target 
   * @param {object} [opts] 
   * @returns {object} `target`
   */
  extend(target, opts)
  {
    exports.register([target], opts);
    return target;
  },

  /**
   * Apply the compatibility version of the observable API;
   * will load the events/observable sub-module on demand.
   * @param {object} target
   * @param {object} [opts]
   * @returns {object} `target`
   * @see module:@lumjs/core/events/observable.makeObservable
   */
  observable(target, opts)
  {
    const {makeObservable} = exports.Observable;
    return makeObservable(target, opts);
  },

  /**
   * See if an object has a known trigger method.
   * 
   * Currently will look for one of:
   * 
   * - `emit`
   * - `trigger`
   * 
   * @param {object} obj - Object we want to find a trigger method on
   * 
   * @returns {?string} The name of the method found,
   * or null if none found.
   */
  hasTrigger(obj)
  {
    for (const trigger of exports.KNOWN_TRIGGERS)
    {
      if (typeof obj[trigger] === F)
      {
        return trigger;
      }
    }
    
    return null;
  },

  /**
   * The list of known trigger method names for `hasTrigger()`
   */
  KNOWN_TRIGGERS: ['emit','trigger'],

}

lazy(exports, 'Observable', () => require('./observable'));
