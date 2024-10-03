// Defining these after observable.
const {B,F,S,def,isObj,isComplex} = require('../types');
const {isObservable} = require('../events/observable');
const lock = Object.freeze;
const copy = Object.assign;

/**
 * The original implementation of the observable API.
 * 
 * This older implementation will be removed entirely when `v2.0` is
 * released, and possibly sooner if I don't find anything broken with
 * the compatibility wrapper. For now it's able to be loaded on demand.
 * 
 * @param {(object|function)} el - The target to add observable API to.
 * 
 * @param {object} [opts] 
 * {@link module:@lumjs/core/observable.observable Observable} options.
 * 
 * Includes a few additional options no longer supported by the
 * new events-based implementation. Only the options exclusive to this
 * version will be documented here.
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
 * @see module:@lumjs/core/observable~API
 * @alias module:@lumjs/core/observable.orig
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

  add('one', function(events, fn) 
  {
    function on() 
    {
      el.off(events, on)
      fn.apply(el, arguments)
    }
    return el.on(events, on);
  });

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
    add(addme, function (obj=null, mopts)
    {
      return observable(obj, copy({}, opts, mopts));
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

// Add an 'is()' method to `observable` itself.
def(observable, 'is', isObservable);

module.exports = observable;
