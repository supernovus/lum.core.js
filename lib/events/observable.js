/**
 * Observable Compatibility API
 * @module @lumjs/core/events/observable
 */
"use strict";

const {B,F,S,def,isComplex,TYPES} = require('../types');
const lock = Object.freeze;
const copy = Object.assign;
const Registry = require('./registry');

const ISOB = 'isObservable';

const OBS_EXTENDS =
{
  registry: '$events',
  listen:   'on',
  emit:     'trigger',
  remove:   'off',
  once:     'one',
}

const OBS_OPTIONS =
{
  wrapargs: false,
  wrapthis: false,
  wraplock: true,
  wrapsetup: null,
  addme: null,
  // addname: !(wrapargs || wrapthis)
  // addis:    (wrapargs || wrapthis)
}

/**
 * A version of the observable API using the events module.
 * 
 * It's obviously not going to be 100% identical due to
 * the very different nature of the backend engine, but it'll
 * try its best to make existing code work.
 * 
 * A few obscure features that I don't think are particularly
 * important and won't affect *most* exising uses will be dropped.
 * 
 * @param {(object|function)} el - The target to add observable API to.
 * 
 * @param {object} [oo] 
 * {@link module:@lumjs/core/observable Observable} options
 * 
 * @param {boolean} [oo.addwrap] If this is `true`, 
 * and `oo.wrapargs` is `false`, then the `event` object 
 * will be appended to the arguments sent to the handler.
 * 
 * The default value is: `!oo.wrapthis`
 * 
 * @param {object} [ro]
 * {@link module:@lumjs/core/events.Registry Registry} options;
 * 
 * The `setupEvent` and `setupListener` options cannot be specified,
 * as the versions from this module will always be used.
 * 
 * The `extend` defaults are changed to match those used
 * by the observable API (`on`,`trigger`,`off`,`one`),
 * and `extend.registry` is set to `$events` by default.
 * 
 * Setting the `extend` option to `false` will have no effect
 * in this implementation.
 * 
 * @param {boolean} [wantReg=false] Return the Registry?
 * @returns {object} normally `el`, unless `wantReg` was `true`
 * @see module:@lumjs/core/observable~API
 * @alias module:@lumjs/core/events/observable.makeObservable
 */
function makeObservable(el, oo, ro, wantReg=false)
{
  if (!isComplex(el))
  {
    throw new TypeError("el was not an object or function");
  }

  ro = copy({}, ro);
  ro.extend = copy({}, OBS_EXTENDS, ro.extend);
  ro.setupEvent = setupEvent;
  ro.setupListener = setupListener;
  oo = ro.observable = copy({}, OBS_OPTIONS, oo);

  let wrapped = (oo.wrapargs || oo.wrapthis);
  if (!wrapped && typeof oo.wrapsetup === F)
  {
    wrapped = oo.wrapargs = true;
  }

  if (typeof oo.wildcard === S)
  { // oo.wildcard takes precedence
    ro.wildcard = oo.wildcard;
  }

  const setIf = (opt, get) => 
  {
    if (typeof oo[opt] !== B)
    {
      oo[opt] = get();
    }
  }

  setIf('addname', () => !wrapped);
  setIf('addis',   () =>  wrapped);
  setIf('addwrap', () => !oo.wrapthis);

  const reg = new Registry([el], ro);

  if (oo.addis)
  {
    def(el, ISOB, lock({event: false, target: true}));
  }

  if (typeof oo.addme === S)
  {
    def(el, oo.addme, function(el2, oo2, ro2)
    {
      return makeObservable(el2, 
        copy({}, oo, oo2),
        copy({}, ro, ro2)
      );
    });
  }

  return wantReg ? reg : el;
}

/**
 * Event setup for observable compatibility
 * @type {module:@lumjs/core/events~SetupEvent}
 * @alias module:@lumjs/core/events/observable.setupEvent
 */
function setupEvent(ev)
{
  const ro = this.registry.options;
  const oo = ro.observable;
  ev.wildcard = this.eventNames.has(ro.wildcard);
  ev.self = ev.target;
  ev.type = ev.name;
  def(ev, ISOB, lock({event: true, target: false}));

  if (typeof oo.wrapsetup === F)
  {
    oo.wrapsetup.call(ev.target, ev);
  }

  if (oo.wraplock)
  {
    lock(ev);
  }
}

/**
 * Listener setup for observable compatibility
 * @type {module:@lumjs/core/events~SetupListener}
 * @alias module:@lumjs/core/events/observable.setupListener
 */
function setupListener(ln)
{
  const oo = this.options.observable;
  const oh = ln.observableHandler = ln.handler;
  const go = (ev, args) => 
  {
    if (typeof oh === F)
    {
      const thisTarget = oo.wrapthis ? ev : ev.target;
      oh.apply(thisTarget, args);
    }
    else
    {
      oh.handleEvent(...args);
    }
  }

  if (!oo.wrapargs)
  { // Not wrapping args, we need to wrap the handler.
    const ec = ln.eventNames.size;
    ln.handler = function(ev)
    {
      const args = ev.args;
      if (ec > 1 && oo.addname)
      {
        args.unshift(ev.name);
      }
      if (oo.addwrap)
      {
        args.push(ev);
      }

      go(ev, args);
    }
  }
  else if (oo.wrapthis)
  { // Both wrapargs and wrapthis are in use, woah!
    ln.handler = function(ev)
    {
      go(ev, [ev]);
    }
  }
}

/**
 * See if a value appears to implement the observable API.
 * 
 * This is a simple function that relies on duck-typing,
 * and only looks for `trigger` and `on` methods.
 * 
 * @param {(object|function)} obj - Value to check for observable API
 * @returns {boolean}
 * @alias module:@lumjs/core/events/observable.isObservable
 */
function isObservable(obj)
{
  return (isComplex(obj)
    && typeof obj.trigger === F
    && typeof obj.on === F);
}

// Undocumented alias for the sake of compatibility.
def(makeObservable, 'is', isObservable);

/**
 * Does a value implement the Observable interface?
 * @name module:@lumjs/core/types.doesObservable
 * @function
 * @param {*} v - The expected object/function to test.
 * @returns {boolean}
 * @see module:@lumjs/core/events/observable.isObservable
 */

/**
 * Extension type for the {@link module:@lumjs/core/observable~API} interface.
 * @memberof module:@lumjs/core/types.TYPES
 * @member {string} OBSERV - Implements the *Observable* interface.
 */
TYPES.add('OBSERV', 'observable', isObservable, 'doesObservable');

module.exports =
{
  makeObservable, setupEvent, setupListener, isObservable,
}
