// Defining these after observable.
const {B,F,S,def,isObj,isComplex,TYPES,console} = require('./types');
const {duplicateAll: clone} = require('./obj/copyall');
const lock = Object.freeze;

/**
 * Make a target object (or function) support the *Observable* API.
 *
 * Adds `on()`, `off()`, `one()`, and `trigger()` methods.
 * 
 * @param {(object|function)} el - The target we are making observable.
 * @param {object} [opts] Options that define behaviours.
 * @param {string} [opts.wildcard='*'] The event name used as a wildcard. 
 * 
 * @param {boolean} [opts.wrapargs=false] If `true`, the event handlers will 
 * be passed a wrapper object as the sole argument:
 * 
 * ```js
 * { 
 *   isObservable:
 *   { // Immutable;
 *     event: true,   // This is an event data object.
 *     target: false, // This is not the target object.
 *   },
 *   wildcard: bool,  // Will be true if this was a wildcard event handler.
 *   func: function,  // The function being called.
 *   args: array,     // The arguments passed to trigger.
 *   self: el,        // The target object.
 *   name: event,     // The event name that was triggered.
 *   target: el,      // An alias to `self`.
 *   type: event,     // An alias to `name`.
 *   // ...
 * }
 * ```
 * 
 * @param {boolean} [opts.wrapthis=false] If `true`, `this` in event 
 * handlers will be the same object as `opts.wrapargs`.
 * 
 * @param {?function} [opts.wrapsetup=null] Setup function for wrapper data.
 * 
 * This function will be called with the target `el` as `this`,
 * and will be passed the wrapper object (before it is locked),
 * so it can examine the event name and arguments passed to
 * `trigger()` and adjust the object accordingly.
 * 
 * This allows the wrapper objects to have a lot more custom properties,
 * and feel more like the standard Event objects used by the `DOM`.
 * 
 * If this is specified, but neither `opts.wrapargs` or `opts.wrapthis` 
 * is `true`, then `opts.wrapargs` will be changed to `true` implicitly.
 * 
 * @param {boolean} [opts.wraplock=true] If `true`, the wrapper object
 * will be made immutable using the `Object.freeze()` method.
 * 
 * @param {boolean} [opts.addname] If `true` callbacks with 
 * multiple events will have the name of the triggered event added as
 * the first parameter.
 * 
 * If either `wrapthis` or `wrapargs` are `true`, then this will default
 * to `false`, otherwise it will default to `true`.
 * 
 * @param {boolean} [opts.addis] If `true` add a read-only, frozen
 * object property named `isObservable` with the value:
 * 
 * ```js
 * {
 *   event: false, // This is not an event data object.
 *   target: true, // This is the target object.
 * }
 * ```
 *
 * If either `wrapthis` or `wrapargs` are `true`, then this will default
 * to `true`, otherwise it will default to `false`.
 * 
 * @param {string} [opts.addme] If set, add a method with this name
 * to the `el` object, which is a version of `observable()` with the
 * default options being the same as the current `opts`.
 * 
 * @param {string} [opts.addre] If set, add a method with this name
 * to the `el` object, which is a function that can re-build the
 * observable API methods with new `opts` replacing the old ones.
 * 
 * The method added takes two arguments, the first being an `object`
 * representing the new options to set on the target. 
 * 
 * The second is an optional `boolean` value that determines if the
 * existing `opts` should be used as defaults for any options not
 * specified in the first argument.
 * 
 * @param {boolean} [opts.reinherit=false] Used as the default value of
 * the second argument of the method added by `opts.addre`.
 * 
 * @param {boolean} [redefine=false] If `true` allow targets already
 * implementing the `on()` and `trigger()` methods to be re-initialized.
 * 
 * Generally only needed if you need to change the `opts` for some reason.
 * This is forced to `true` by the method added by `opts.addre`.
 *
 * @returns {object} el
 * 
 * @exports module:@lumjs/core/observable
 */
function observable (el={}, opts={}, redefine=false) 
{
  //console.debug("observable", el, opts);

  if (!isComplex(el))
  { // Don't know how to handle this, sorry.
    throw new Error("non-object sent to observable()");
  }

  if (isObservable(el) && !redefine)
  { // It's already observable.
    return el;
  }

  if (typeof opts === B)
  { // Assume it's the wrapthis option.
    opts = {wrapthis: opts};
  }
  else if (!isObj(opts))
  {
    opts = {};
  }

  const noSpace = /^\S+$/;

  const wildcard = (typeof opts.wildcard === S 
    && noSpace.test(opts.wildcard))
    ? opts.wildcard
    : '*';

  const wrapsetup = (typeof opts.wrapsetup === F)
    ? opts.wrapsetup 
    : null;

  const wrapthis = (typeof opts.wrapthis === B) 
    ? opts.wrapthis 
    : false;

  const wrapargs = (typeof opts.wrapargs === B)
    ? opts.wrapargs
    : (wrapsetup ? !wrapthis : false);

  const wrapped = (wrapthis || wrapargs);

  const wraplock = (typeof opts.wraplock === B)
    ? opts.wraplock
    : true;

  const addname = (typeof opts.addname === B) 
    ? opts.addname 
    : !wrapped;

  const addis = (typeof opts.addis === B)
    ? opts.addis
    : wrapped;

  const validIdent = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;

  const addme = (typeof opts.addme === S
    && validIdent.test(opts.addme))
    ? opts.addme
    : null;

  const addre = (typeof opts.addre === S
    && validIdent.test(opts.addre))
    ? opts.addre
    : null;

  const slice = Array.prototype.slice;

  function onEachEvent (e, fn) 
  { 
    const es = e.split(/\s+/);
    const me = es.length > 1;
    for (e of es)
    {
      fn(e, me);
    }
  }

  const add = def(el);

  function runCallback (name, fn, args)
  {
    if (fn.busy) return;
    fn.busy = 1;

    let fobj;

    if (wrapped)
    { // Something is going to use our wrapper object.
      const isWild = (name === wildcard);
      const fname = isWild ? (addname ? args[0] : args.shift()) : name;

      fobj = 
      {
        isObservable: lock({event: true, target: false}),
        self: el,
        target: el,
        name: fname, 
        type: fname,
        func: fn,
        wildcard: isWild,
        args,
      };

      if (wrapsetup)
      {
        wrapsetup.call(el, fobj);
      }

      if (wraplock)
      {
        lock(fobj);
      }
    }

    const fthis = wrapthis ? fobj : el;
    const fargs = wrapargs ? [fobj] 
      : ((fn.typed && addname) ? [name].concat(args) : args);
    
    fn.apply(fthis, fargs);
    fn.busy = 0;
  }

  let callbacks = {};

  /**
  * Assign an event handler
  * 
  * Listen to the given space separated list of `events` and execute
  * the `callback` each time an event is triggered.
  * @param  {string} events - events ids
  * @param  {function} fn - callback function
  * @returns {object} el
  */
  add('on', function(events, fn) 
  {
    if (typeof fn !== F)
    {
      console.error("non-function passed to on()");
      return el;
    }

    onEachEvent(events, function(name, typed) 
    {
      (callbacks[name] = callbacks[name] || []).push(fn);
      fn.typed = typed;
    });

    return el;
  });

  /**
  * Removes the given space separated list of `events` listeners
  * 
  * @param   {string} events - events ids
  * @param   {function} fn - callback function
  * @returns {object} el
  */
  add('off', function(events, fn) 
  {
    if (events === wildcard && !fn) 
    { // Clear all callbacks.
      callbacks = {};
    }
    else 
    {
      onEachEvent(events, function(name) 
      {
        if (fn) 
        { // Find a specific callback to remove.
          var arr = callbacks[name]
          for (var i = 0, cb; cb = arr && arr[i]; ++i) 
          {
            if (cb == fn) arr.splice(i--, 1);
          }
        } 
        else 
        { // Remove all callbacks for this event.
          delete callbacks[name];
        }
      });
    }
    return el
  });

  /**
  * Add a one-shot event handler.
  * 
  * Listen to the given space separated list of `events` and execute 
  * the `callback` at most once.
  * 
  * @param   {string} events - events ids
  * @param   {function} fn - callback function
  * @returns {object} el
  */
  add('one', function(events, fn) 
  {
    function on() 
    {
      el.off(events, on)
      fn.apply(el, arguments)
    }
    return el.on(events, on);
  });

  /**
  * Execute all callback functions that listen to the given space 
  * separated list of `events`
  * @param   {string} events - events ids
  * @returns {object} el
  */
  add('trigger', function(events) 
  {
    // getting the arguments
    // skipping the first one
    const args = slice.call(arguments, 1);

    onEachEvent(events, function(name) 
    {
      const fns = slice.call(callbacks[name] || [], 0);

      for (var i = 0, fn; fn = fns[i]; ++i) 
      {
        runCallback(name, fn, args);
        if (fns[i] !== fn) { i-- }
      }

      if (callbacks[wildcard] && name != wildcard)
      { // Trigger the wildcard.
        el.trigger.apply(el, ['*', name].concat(args));
      }

    });

    return el
  });

  if (addis)
  {
    add('isObservable', lock({event: false, target: true}));
  }

  if (addme)
  { // Add a wrapper for observable() that sets new default options.
    add(addme, function (obj=null, mopts={})
    {
      return observable(obj, clone(opts, mopts));
    });
  }

  if (addre)
  { // Add a method to change the observable options.
    const reinherit = opts.reinherit ?? false;

    add(addre, function(replacementOpts={}, inherit=reinherit)
    {
      const newOpts 
        = inherit 
        ? Object.assign({}, opts, replacementOpts)
        : replacementOpts;
      return observable(el, replacementOpts, true);
    });
  }

  // Metadata
  add('$$observable$$', lock({opts, observable}));

  return el

} // observable()

module.exports = observable;

/**
 * See if a value implements the *Observable* interface.
 * 
 * @function module:@lumjs/core/observable.is
 * @param {*} obj - The expected object/function to test.
 * @returns {boolean}
 */
function isObservable(obj)
{
  return (isComplex(obj)
    && typeof obj.trigger === F
    && typeof obj.on === F);
}

// Add an 'is()' method to `observable` itself.
def(observable, 'is', isObservable);

/**
 * Does a value implement the Observable interface?
 * @name module:@lumjs/core/types.doesObservable
 * @function
 * @param {*} v - The expected object/function to test.
 * @returns {boolean}
 * @see module:@lumjs/core/observable.is
 */

/**
 * Extension type for the {@link module:@lumjs/core/observable} interface.
 * @memberof module:@lumjs/core/types.TYPES
 * @member {string} OBSERV - Implements the *Observable* interface.
 */

TYPES.add('OBSERV', 'observable', isObservable, 'doesObservable');
