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
    exports.register(target, opts);
    return target;
  },
}
