"use strict";

const {S,F,isObj,def,isIterable} = require('../types');
const Listener = require('./listener');
const RegSym = Symbol('@lumjs/core/events:registry');
const cp = Object.assign;

const DEF_EXTENDS =
{
  registry: 'events',
  listen:   'on',
  emit:     'emit',
  remove:   null,
  once:     null,
}

const INT_EXTENDS =
{
  listeners: true,
  results:   true,
  onDemand:  false,
}

const DEF_OPTIONS =
{
  delimiter: /\s+/,
  multiMatch: false,
  wildcard: '*',
}

const RES_PROPS =
[
  'eventNames', 'targets', 'multiMatch', 'onceRemoved', 'stopEmitting',
  'emitted', 'targetListeners', 'registry',
]

/**
 * Has a target object been registered with an event registry?
 * @param {object} target 
 * @returns {boolean}
 * @alias module:@lumjs/core/events.Registry.isRegistered
 */
const isRegistered = target => isObj(target[RegSym]);

/**
 * Get event registry metadata from a target
 * @private
 * @param {object} target - Object to get metadata for
 * @param {boolean} [create=false] Create metadata if it's not found?
 * @returns {object} metadata (TODO: schema docs)
 * @alias module:@lumjs/core/events.Registry.getMetadata
 */
function getMetadata(target, create=false)
{
  if (isRegistered(target))
  { // Existing registry metadata found
    return target[RegSym];
  }
  else if (create)
  { // Create new metadata
    const tpm = 
    {
      r: new Map(),
      p: {},
    }
    def(target, RegSym, tpm);
    return tpm;
  }
}

function targetsAre(targets)
{
  const isaSet = (targets instanceof Set);
  const isaArr = (!isaSet && Array.isArray(targets));
  const tis =
  {
    set: isaSet,
    array: isaArr,
    handled: (isaSet || isaArr),
  }
  return tis;
}

/**
 * A class that handles events for target objects
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
 * @alias module:@lumjs/core/events.Registry
 */
class LumEventRegistry
{
  /**
   * Create a new registry instance for one or more target objects
   * 
   * @param {(object|module:@lumjs/core/events~GetTargets)} targets
   * 
   * If this is an `object`, then any kind of `Iterable` may be used
   * to represent multiple targets, while any non-Iterable object will
   * be considered as single target. 
   * 
   * If this is a `function`, it will be called to dynamically get a
   * list of target objects whenever an event is triggered.
   * 
   * If you want to use a `function` as an actual target, you'll need to
   * wrap it in an array or other iterable object.
   * 
   * @param {object} [opts] Options
   * 
   * A _compiled_ version is saved to the `options` property.
   * The compiled version includes a bunch of defaults, and various
   * compose rules (mostly for the `.extend` nested options).
   * 
   * @param {(RegExp|string)} [opts.delimiter=/\s+/] Used to split event names
   * 
   * @param {object} [opts.extend] Options for wrapper methods/properties
   * 
   * The `boolean` options determine if extension methods will be added to
   * certain types of objects (and in some cases, when to do so).
   * 
   * The `?string` options are each the names of properties/methods in the
   * Registry class. If they are set to a `string` then that will be the
   * name used for the wrapper property/method added to objects. If it
   * is explicitly set to `null` it means skip adding a wrapper for that
   * method/property. If it is omitted entirely the default will be used.
   * 
   * @param {boolean} [opts.extend.targets] Extend target objects?
   * 
   * The default will be `true` when `targets` is an `object`, or `false`
   * when `targets` is a `function`.
   * 
   * @param {boolean} [opts.extend.listeners=true] Extend Listener instances?
   * As returned by `makeListener()`, `listen()`, and `once()`
   * @param {boolean} [opts.extend.results=true] Extend `emit()` results?
   * @param {boolean} [opts.extend.onDemand=false] On-demand target setup
   * 
   * If `targets` was a `function` and this is set to `true`, then
   * we'll perform the target setup on every emit() call. The setup process
   * is skipped on any targets that have already been set up, so this
   * is meant for dynamic targets that may change on every call.
   * 
   * @param {?string} [opts.extend.registry="events"] Registry property;
   * only added to `targets`, never to listeners or results which have
   * their own inherent `registry` property already.
   * 
   * @param {?string} [opts.extend.emit="emit"] `emit()` proxy method
   * @param {?string} [opts.extend.listen="on"] `listen()` proxy method
   * @param {?string} [opts.extend.once=null]   `once()` proxy method
   * @param {?string} [opts.extend.remove=null] `remove()` proxy method
   * 
   * The `remove` wrapper method added to Listener instances is slightly
   * different than the one added to other objects, as if you call it
   * with no arguments, it will pass the Listener itself as the argument.
   * 
   * @param {boolean} [opts.multiMatch=false]
   * If a registered listener has multiple event names, and a call
   * to `emit()` also has multiple event names, the value of this
   * option will determine if the same listener will have its
   * handler function called more than once.
   * 
   * If this is `true`, the handler will be called once for every
   * combination of target and event name.
   * 
   * If this is `false` (default), then only the first matching event 
   * name will be called for each target.
   *
   * @param {boolean} [opts.overwrite=false] Overwrite existing properties?
   * 
   * If `true` then when adding wrapper methods, the properties from
   * `opts.extend` will replace any existing ones in each target.
   * 
   * @param {module:@lumjs/core/events~SetupEvent} [opts.setupEvent]
   * 
   * If this is specified (either here or in individual listeners),
   * it will be called and passed the Event object at the very end of
   * its constructor.
   * 
   * @param {module:@lumjs/core/events~SetupListener} [opts.setupListener]
   * 
   * If this is specified, it will be called and passed the Listener
   * object at the very end of its constructor.
   * 
   * @param {string} [opts.wildcard='*'] Wildcard event name.
   * 
   * - If you use this in `listen()` the handler will be used regardless
   *   as to what event name was triggered. You can always see which
   *   event name was actually triggered by using `event.name`.
   * - If you use this in `remove()` it calls `removeAll()` to remove all
   *   registered listeners.
   */
  constructor(targets, opts={})
  {
    let defExt; // Default opts.extend.targets value
    if (typeof targets === F)
    { // A dynamic getter method
      this.funTargets = true;
      this.getTargets = targets;
      targets = this.getTargets();
      defExt = false;
    }
    else
    { // Simple getter for a static value
      if (!(targets instanceof Set))
      {
        if (!isIterable(targets))
          targets = [targets];
        targets = new Set(targets);
      }

      this.funTargets = false;
      this.getTargets = () => targets;
      defExt = true;
    }

    // Build composite extend rules
    const extend = cp(
      {targets: defExt}, 
      INT_EXTENDS, 
      DEF_EXTENDS, 
      opts.extend);

    // Now compile the final options
    this.options = cp({}, DEF_OPTIONS, opts, {extend});

    this.allListeners = new Set();
    this.listenersFor = new Map();

    this.setupTargets(targets);
  } // constructor()

  /**
   * Set up target objects
   * 
   * Always sets the necessary metadata on each target.
   * May also extend the targets with wrapper properties and methods
   * depending on the `options.extend` values set.
   * 
   * Not meant to be called from outside code.
   * @private
   * @param  {Iterable} targets - Targets to extend
   * @returns {module:@lumjs/core/events.Registry} `this`
   */
  setupTargets(targets)
  {
    const opts = this.options;
    const extOpts = opts.extend;
    const intNames = extOpts.targets ? Object.keys(DEF_EXTENDS) : null;

    for (const target of targets)
    {
      const tps = {}, tpm = getMetadata(target, true);
      if (tpm.r.has(this)) continue; // Already set up with this registry.
      tpm.r.set(this, tps);

      if (extOpts.targets)
      {
        for (const iname of intNames)
        {
          if (typeof extOpts[iname] === S && extOpts[iname].trim() !== '')
          {
            const ename = extOpts[iname];
            const value = iname === 'registry' 
              ? this // The registry instance itself
              : (...args) => this[iname](...args) // A proxy method
            if (opts.overwrite || target[ename] === undefined)
            {
              def(target, ename, {value});
              tps[ename] = iname;
              tpm.p[ename] = this;
            }
            else
            {
              console.error("Won't overwrite existing property",
                {target,iname,ename,registry: this});
            }
          }
        }
      }
    }

    return this;
  }

  /**
   * Add extension methods to internal objects;
   * currently supports Listener instances and result/status objects.
   * Not meant to be called from outside code.
   * @private
   * @param {object} obj - Internal object to extend
   * @returns {module:@lumjs/core/events.Registry} `this`
   */
  extendInternal(obj)
  {
    const opts = this.options;
    const extOpts = opts.extend;
    const intNames = Object.keys(DEF_EXTENDS);
    const isLs = (obj instanceof Listener);
    const reserved = isLs ? Listener.classProps : RES_PROPS;

    for (const iname of intNames)
    {
      if (iname === 'registry') continue; // skip the registry property
      if (typeof extOpts[iname] === S && extOpts[iname].trim() !== '')
      {
        const ename = extOpts[iname];
        if (reserved.includes(ename))
        { // Skip reserved names
          console.warn("reserved property", {ename, obj, registry: this});
          continue;
        }

        const value = (isLs && iname === 'remove') 
          ? (what=obj) => this.remove(what)   // special remove wrapper
          : (...args) => this[iname](...args) // regular wrapper method
        if (opts.overwrite || obj[ename] === undefined)
        {
          def(obj, ename, {value});
        }
      }  
    }

    return this;
  }

  /**
   * Build a new Listener instance; used by `listen()` method.
   * 
   * @param  {(string|object)} eventNames 
   * What this does depends on the type, and the number of arguments passed.
   * 
   * If this is an `object` **AND** is *the only argument* passed,
   * it will be used as the `spec`, and the `spec.eventNames`
   * and `spec.listener` properties will become mandatory.
   * 
   * If it's a string *OR* there is more than one argument, this 
   * will be used as the `spec.eventNames` property.
   * 
   * @param {module:@lumjs/core/events~Handler} [handler] 
   * Used as the `spec.handler` property if specified.
   * 
   * This is mandatory if `eventNames` argument is a `string`!
   * 
   * @param {object} [spec] The listener specification rules
   * 
   * @param {(string|Iterable)} [spec.eventNames] Event names to listen for
   * 
   * See {@link module:@lumjs/core/events.Registry#getEventNames} for details.
   * 
   * @param {module:@lumjs/core/events~Handler} [spec.handler] Event handler.
   * 
   * @param {(function|object)} [spec.listener] An alias for `handler`
   * 
   * @param {object} [spec.options] Options for the listener
   * 
   * The option properties can be included directly in the `spec` itself
   * for brevity, but a nested `options` object is supported to be more
   * like the `DOM.addEventListener()` method. Either way works fine.
   * 
   * If `spec.options` is used, the properties in it take precedence over
   * those directly in the `spec` object. Note that you cannot use the
   * names `listener`, `handler` or `eventNames` as option properties,
   * and if found, they will be removed.
   * 
   * You may also override the `setupEvent` and `setupListener` registry
   * options here if needed.
   * 
   * @param {boolean} [spec.options.once=false] Only use the listener once?
   * 
   * If this is set to `true`, then the first time this listener is used in
   * an {@link module:@lumjs/core/events.Registry#emit emit()} call, it will
   * be removed from the registry at the end of the emit process (after all
   * events for all targets have been triggered).
   * 
   * @returns {module:@lumjs/core/events.Listener} A new `Listener` instance
   */
  makeListener(...args)
  {
    let spec;

    if (args.length === 0 || args.length > 3)
    { 
      console.error({args, registry: this});
      throw new RangeError("Invalid number of arguments");
    }
    else if (args.length === 1 && isObj(args[0]))
    { // listen(spec)
      spec = cp({}, args[0]);
    }
    else
    { // listen(eventNames, listener, [spec])
      spec = cp({}, args[2]);
      spec.eventNames = args[0];
      spec.handler    = args[1];
    }

    const lsnr = new Listener(this, spec);
    if (this.options.extend.listeners)
    {
      this.extendInternal(lsnr);
    }
    return lsnr;
  }

  /**
   * Assign a new event listener.
   * 
   * Calls `this.makeListener()` passing all arguments to it.
   * Then calls `this.add(listener)` passing the newly make `Listener`.
   * 
   * @param {...mixed} args
   * @returns {module:@lumjs/core/events.Listener}
   */
  listen()
  {
    const listener = this.makeListener(...arguments)
    this.add(listener);
    return listener;
  }

  /**
   * Assign a new event listener that will only run once.
   * 
   * Calls `this.listen()` passing all arguments to it,
   * then sets the `listener.options.once` to `true`.
   * 
   * @param {...mixed} args
   * @returns {module:@lumjs/core/events.Listener}
   */
  once()
  {
    const listener = this.listen(...arguments);
    listener.options.once = true;
    return listener;
  }

  /**
   * Add a Listener instance.
   * 
   * You'd generally use `listen()` or `once()` rather than this, but if
   * you need to (re-)add an existing instance, this is the way to do it.
   * 
   * @param {module:@lumjs/core/events.Listener} listener - Listener instance
   * 
   * If the same instance is passed more than once it will have no affect,
   * as we store the instances in a `Set` internally, so it'll only ever
   * be stored once.
   * 
   * @returns {module:@lumjs/core/events.Registry} `this`
   */
  add(listener)
  {
    if (!(listener instanceof Listener))
    {
      console.error({listener, registry: this});
      throw new TypeError("Invalid listener instance");
    }

    this.allListeners.add(listener);

    for (const ename of listener.eventNames)
    {
      let lset;
      if (this.listenersFor.has(ename))
      {
        lset = this.listenersFor.get(ename);
      }
      else
      {
        lset = new Set();
        this.listenersFor.set(ename, lset);
      }

      lset.add(listener);
    }
    
    return this;
  }

  /**
   * Remove **ALL** registered event listeners!
   * @returns {module:@lumjs/core/events.Registry} `this`
   */
  removeAll()
  {
    this.allListeners.clear();
    this.listenersFor.clear();
    return this;
  }

  /**
   * Remove specific event names.
   * 
   * It will remove any of the the specified event names
   * from applicable listener instances, and clear the
   * associated `listenersFor` set.
   * 
   * If a listener has no more event names left, that listener
   * will be removed from the `allListeners` set as well.
   * 
   * @param  {...string} names - Event names to remove
   * 
   * If the `wildcard` string is specified here, this will simply
   * remove any wildcard listeners currently registered.
   * See `remove(wildcard)` or `removeAll()` if you really want
   * to remove **ALL** listeners.
   * 
   * @returns {module:@lumjs/core/events.Registry} `this`
   */
  removeEvents(...names)
  {
    for (const name of names)
    {
      if (this.listenersFor.has(name))
      {
        const eventListeners = this.listenersFor.get(name);
        for (const lsnr of eventListeners)
        {
          lsnr.eventNames.delete(name);
          if (!lsnr.hasEvents)
          { // The last event name was removed.
            this.removeListeners(lsnr);
          }
        }
        eventListeners.clear();
      }
    }
    return this;
  }

  /**
   * Remove specific Listener instances
   * @param {...module:@lumjs/core/events.Listener} listeners 
   * @returns {module:@lumjs/core/events.Registry} `this`
   */
  removeListeners(...listeners)
  {
    for (const listener of listeners)
    {
      if (this.allListeners.has(listener))
      { // First remove it from allListeners
        this.allListeners.delete(listener);
  
        for (const ename of listener.eventNames)
        {
          if (this.listenersFor.has(ename))
          {
            const lset = this.listenersFor.get(ename);
            lset.delete(listener);
          }
        }
      }
    }
    return this;
  }

  /**
   * Remove listeners based on the value type used.
   * 
   * @param {(string|module:@lumjs/core/events.Listener)} what
   * 
   * - If this is the `wildcard` string, then this will call `removeAll()`.
   * - If this is any other `string` it will be split using `splitNames()`,
   *   and the resulting strings passed as arguments to `removeEvents()`.
   * - If this is a `Listener` instance, its passed to `removeListeners()`.
   * 
   * @returns {module:@lumjs/core/events.Registry} `this`
   * @throws {TypeError} If `what` is none of the above values.
   */
  remove(what)
  {
    if (what === this.options.wildcard)
    {
      return this.removeAll();
    }
    else if (typeof what === S)
    { 
      const events = this.splitNames(what);
      return this.removeEvents(...events);
    }
    else if (what instanceof Listener)
    {
      return this.removeListeners(what);
    }
    else
    {
      console.error({what, registry: this});
      throw new TypeError("Invalid event name or listener instance");
    }
  }

  /**
   * Emit (trigger) one or more events.
   * 
   * @param {(string|string[])} eventNames - Events to emit.
   * 
   * If this is a single `string` it will be split via `splitNames()`.
   * 
   * @param  {object} [data] A data object (highly recommended);
   * will be assigned to `event.data` if specified.
   * 
   * @param  {...any} [args] Any other arguments;
   * will be assigned to `event.args`.
   * 
   * Note: if a `data` object argument was passed, it will always 
   * be the first item in `event.args`.
   * 
   * @returns {module:@lumjs/core/events~Status}
   */
  emit(eventNames, ...args)
  {
    const extOpts = this.options.extend;
    const sti =
    {
      eventNames: this.getEventNames(eventNames),
      multiMatch: this.options.multiMatch,
      onceRemoved: new Set(),
      stopEmitting: false,
      emitted: [],
      registry: this,
    }

    if (extOpts.results)
    {
      this.extendInternal(sti);
    }

    { // Get the targets.
      const tgs = this.getTargets(sti);
      sti.targets = (tgs instanceof Set) ? tgs : new Set(tgs);
      if (this.funTargets && extOpts.onDemand)
      {
        this.setupTargets(sti.targets);
      }
    }

    const wilds = this.listenersFor.get(this.options.wildcard);

    emitting: for (const tg of sti.targets)
    {
      const called = sti.targetListeners = new Set();
      for (const ename of sti.eventNames)
      {
        if (!this.listenersFor.has(ename)) continue;

        let listeners = this.listenersFor.get(ename);
        if (wilds) listeners = listeners.union(wilds);

        for (const lsnr of listeners)
        {
          if (sti.multiMatch || !called.has(lsnr))
          { // Let's emit an event!
            called.add(lsnr);
            const event = lsnr.emitEvent(ename, tg, args, sti);
            sti.emitted.push(event);
            if (sti.stopEmitting)
            {
              break emitting;
            }
          }
        }
      }
    }

    // Nix the targetListeners property.
    delete sti.targetListeners;

    // Handle any `onceRemoved` listeners.
    for (const lsnr of sti.onceRemoved)
    {
      this.removeListeners(lsnr);
    }

    // Return the final status.
    return sti;
  }

  /**
   * Register additional target objects
   * @param  {...object} addTargets - Target objects to register
   * @returns {module:@lumjs/core/events.Registry} `this`
   */
  register(...addTargets)
  {
    const allTargets = this.getTargets();
    const tis = targetsAre(allTargets);

    if (tis.handled)
    {
      for (const target of addTargets)
      {
        if (tis.set)
        {
          allTargets.add(target);
        }
        else if (tis.array)
        {
          if (allTargets.indexOf(target) === -1)
          {
            allTargets.push(target);
          }
        }
      }
    }
    else
    {
      if (!tis.handled)
      {
        console.warn("cannot add targets to collection", 
          {addTargets, allTargets, registry: this});
      }
    }

    this.setupTargets(addTargets);
    return this;
  }

  /**
   * Remove a target object from the registry.
   * 
   * This will also remove any extension properties added to the
   * target object by this registry instance.
   * 
   * @param  {...object} [delTargets] Targets to unregister
   * 
   * If no targets are specified, this will unregister **ALL** targets
   * from this registry!
   * 
   * @returns {module:@lumjs/core/events.Registry} `this`
   */
  unregister(...delTargets)
  {
    const allTargets = this.getTargets();
    const tis = targetsAre(allTargets);

    if (delTargets.length === 0)
    { // Unregister ALL targets.
      delTargets = allTargets;
    }

    if (!tis.handled)
    {
      console.warn("cannot remove targets from collection", 
        {delTargets, allTargets, registry: this});
    }

    for (const target of delTargets)
    {
      if (!isRegistered(target)) continue;

      const tpm = target[RegSym];
      const tp  = tpm.r.get(this);

      if (tis.set)
      {
        allTargets.delete(target);
      }
      else if (tis.array)
      {
        const tin = allTargets.indexOf(target);
        if (tin !== -1)
        {
          allTargets.splice(tin, 1);
        }
      }
      
      if (isObj(tp))
      { // Remove any added extension properties
        for (const ep in tp)
        {
          if (tpm.p[ep] === this)
          { // Remove it from the target.
            delete target[ep];
            delete tpm.p[ep];
          }
        }
        tpm.r.delete(this);
      }

      if (tpm.r.size === 0)
      { // No registries left, remove the metadata too
        delete target[RegSym];
      }
    }

    return this;
  }

  /**
   * Get a Set of event names from various kinds of values
   * @param {(string|Iterable)} names - Event names source
   * 
   * If this is a string, it'll be passed to `splitNames()`.
   * If it's any kind of `Iterable`, it'll be converted to a `Set`.
   * 
   * @returns {Set}
   * @throws {TypeError} If `names` is not a valid value
   */
  getEventNames(names)
  {
    if (typeof names === S)
    {
      return this.splitNames(names);
    }
    else if (names instanceof Set)
    {
      return names;
    }
    else if (isIterable(names))
    {
      return new Set(names);
    }
    else
    {
      console.error({names, registry: this});
      throw new TypeError("Invalid event names");
    }
  }

  /**
   * Split a (trimmed) string using `this.options.delimiter`
   * @param {string} names - String to split
   * @returns {Set}
   */
  splitNames(names)
  {
    return new Set(names.trim().split(this.options.delimiter));
  }

}

cp(LumEventRegistry, 
{ 
  isRegistered, getMetadata, targetsAre,
});

module.exports = LumEventRegistry;
