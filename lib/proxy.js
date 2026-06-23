/**
 * Proxy related helpers.
 * @module @lumjs/core/proxy
 */

const { isObj, isProperty } = require('./types/basics.js');
const { getOwnKeys, isEmptyObject } = require('./obj/keys.js');

const cp = Object.assign;
const hasItems = obj => !isEmptyObject(obj);

/**
 * A class that helps build simple Proxy wrappers.
 */
class ProxyManager {
  /**
   * Create a ProxyManager instance.
   * 
   * @param {(object|function)} target - Target to be wrapped by Proxy.
   * 
   * @param {object} [opts] Options; saved as `this.opts`.
   * 
   * @param {object} [opts.handler] Additional Proxy handler hooks/traps.
   * 
   * As ProxyManager currently only supports `get` and `set` hooks, you can
   * use this option to provide further handler functions.
   * 
   * Obviously you shouldn't specify `get` or `set` in this, as those hooks
   * are built automatically during handler registration.
   * 
   * In the future more directly-supported hooks may be added.
   * 
   * @param {object} [opts.handlers] An alias for `opts.handler`.
   * 
   * If for whatever reason both this and `opts.handler` are specified,
   * they will both be compsed into `this.handler`. As this is the alias,
   * `opts.handler` will take precedence in the case of name conflicts.
   * 
   * @param {(string|symbol)} [opts.selfKey] Proxy property for the manager.
   * 
   * If this option is specified, then it will be used as the name of a 
   * property that when accessed, returns the ProxyManager instance itself.
   * 
   */
  constructor(target, opts = {}) {
    this.opts = opts;
    this.target = target;
    this.bound = {};
    this.props = {};
    this.getters = {};
    this.setters = {};
    this.handler = cp({}, opts.handlers, opts.handler);
  }

  /**
   * Add various types of proxied properties using descriptor-like rules.
   * 
   * This is a frontend method that uses descriptor objects similar to the
   * ones used by `Object.defineProperties()`, but with a few extensions.
   * 
   * @param {Object.<(string|symbol), module:@lumjs/core/proxy~Desc>} descs
   * Extended property descriptors for every property you want to add.
   * 
   * If the *value* of any property in the `descs` is **NOT** an object,
   * it will be treated the same as an object with a `value` property.
   * See the `test/proxy-manager.js` for an example.
   * 
   * @returns {this}
   */
  add(descs) {
    if (!isObj(descs)) {
      console.error({ descs, pm: this });
      throw new TypeError('descs must be an object');
    }

    let keys = getOwnKeys(descs);
    let props = {};

    for (let key of keys) {
      let desc = descs[key];

      if (!isObj(desc)) {
        props[key] = desc;
      }
      else if (typeof desc.bind === 'function') {
        let meth = { [key]: desc.bind };
        this.bind(meth, desc);
      }
      else if (
        typeof desc.get === 'function'
        || typeof desc.set === 'function'
      ) {
        this.addAccessor(key, desc.get, desc.set);
      }
      else if (desc.value !== undefined) {
        props[key] = desc.value;
      }
      else {
        console.error('unsupported desc', { key, desc, descs, pm: this });
      }
    }

    if (hasItems(props)) {
      this.assign(props);
    }

    return this;
  }

  /**
   * Add accessor properties (getter and/or setter functions).
   * @param {(string|symbol)} key - Property name to add.
   * @param {?module:@lumjs/core/proxy~GetterFun} getter
   * 
   * Use `null` for no getter (for instance if you have a static
   * value you're going to set with addValues() but still want a
   * setter for whatever reason).
   * 
   * @param {?module:@lumjs/core/proxy~SetterFun} [setter]
   * 
   * Use `null` (or simply omit entirely) if you don't want a setter.
   * 
   * @returns {this}
   */
  addAccessor(key, getter, setter) {
    if (!isProperty(key)) {
      console.error('addAccessor', { key, getter, setter });
      throw new TypeError('Invalid property key');
    }

    if (typeof getter === 'function') {
      this.getters[key] = getter;
    }

    if (typeof setter === 'function') {
      this.setters[key] = setter;
    }

    return this;
  }

  /**
   * Assign proxied property values.
   * 
   * @param {object} props - Properties to add.
   * 
   * Property values may use *any* JS type except `undefined`.
   * The values will be used as-is with no descriptor parsing,
   * function binding, accessor assignments, or anything else like that.
   * 
   * Both string and symbol property keys are supported.
   * 
   * @returns {this}
   */
  assign(props) {
    cp(this.props, props);
    return this;
  }

  /**
   * Add bound wrapper methods.
   * 
   * This is specifically for creating *bound* methods using `function.bind()`; 
   * Use `add()` or `addProps()` for regular (non-bound) methods.
   * 
   * @param {object} methods - Methods to add.
   * 
   * All of the functions in this object will be used to create bound methods.
   * 
   * The default binding rules will use the ProxyManager instance as `this`,
   * and pass `this.target` as the first argument. See the `opts` for details.
   * 
   * @param {object} [opts] Options for creating bound methods.
   * @param {number} [opts.passFirst] Bind the first argument?
   * 
   * If this is `0`, it means don't use any bound argument.
   * 
   * Any other non-zero value must be one of the `ProxyManager.BIND` values:
   * - `BIND.M` → Use the ProxyManager instance.
   * - `BIND.R` → Use the Proxy receiver object.
   * - `BIND.T` → Use the underlying target object.
   * 
   * Default: `BIND.R`
   * 
   * @param {number} [opts.useThis] What to bind as `this`.
   * 
   * Must be one of the `ProxyManager.BIND` values.
   * 
   * Default: `BIND.M`
   * 
   * @returns {this}
   */
  bind(methods, opts = {}) {
    let keys = getOwnKeys(methods);

    for (let key of keys) {
      let fn = methods[key];
      if (typeof fn === 'function') {
        this.bound[key] = {fn, opts};
      }
    }
    
    return this;
  }

  /**
   * Build the Proxy.
   * 
   * @param {object} [opts] Options.
   * @param {?boolean} [opts.cache=null] Cache the Proxy?
   * 
   * If this is `true`, then the Proxy instance will be saved as `this.proxy`,
   * and future calls to this method will return the cached copy by default.
   * 
   * If this is `false` then the Proxy will not be cached.
   * 
   * If this is not specified (or `null`) then its default will be `true` if
   * there is not already a cached proxy, or `false` if there is.
   * 
   * @param {boolean} [opts.new=false] Always return a new Proxy instance?
   * 
   * If this is `true` then a new Proxy instance will be created and returned,
   * regardless as to if one had been cached previously. Default: `false`.
   * 
   * @returns {Proxy}
   */
  build(opts = {}) {
    let wantNew = opts.new ?? false;
    let cacheIt = opts.cache ?? !this.proxy;

    if (wantNew || !this.proxy) {
      this.register();
      let proxy = new Proxy(this.target, this.handler);
      this.setup(proxy);
      if (cacheIt) this.proxy = proxy;
      return proxy;
    }

    return this.proxy;
  }

  /**
   * Register our internal handler hooks (aka traps). 
   *
   * This will create a `get` hook if *ANY* of the following are true:
   * - A valid `this.opts.selfKey` value was specified.
   * - The addAccessor() method registered a _getter_ function.
   * - The addMethod() and/or addValues() methods were called.
   * The order listed above is also the order any of the virtual
   * properties will be checked for in the generated hook.
   * 
   * This will create a `set` hook if:
   * - The addAccessor() method registered a _setter_ function.
   * 
   * The hooks created by this will **overwrite** any `get` or `set` hooks
   * that may already be in the `this.handler` object.
   * 
   * This is called by build() automatically when it creates a new Proxy.
   * @protected
   * @returns {this}
   */
  register() {
    const pm = this;
    const selfKey = this.opts.selfKey;
    const hasSelf = isProperty(selfKey);

    if (hasSelf || hasItems(pm.props) || hasItems(pm.getters)) {
      pm.handler.get = function (target, prop, receiver) {
        let pi = {manager: pm, op: 'get', prop, receiver, target}

        if (hasSelf && prop === selfKey) {
          return pm;
        }

        if (typeof pm.getters[prop] === 'function') {
          return pm.getters[prop].call(receiver, pi);
        }

        if (pm.props[prop] !== undefined) {
          return pm.props[prop];
        }

        return Reflect.get(...arguments);
      }
    }

    if (hasItems(pm.setters)) {
      pm.handler.set = function (target, prop, val, receiver) {
        let pi = {manager: pm, op: 'set', prop, receiver, target}

        if (typeof pm.setters[prop] === 'function') {
          return (pm.setters[prop].call(receiver, val, pi) ?? true);
        }

        return Reflect.set(...arguments);
      }
    }

    return this;
  }

  /**
   * Setup that is called after the Proxy instance has been registered.
   * 
   * This is currently used to (re-)generate any bound methods.
   * It may have further uses in the future.
   * 
   * It is called automatically by the build() method.
   * 
   * @protected
   * @param {(object|function)} proxy - The Proxy object.
   * @returns {this}
   */
  setup(proxy) {
    let ps = this.props;
    let keys = getOwnKeys(this.bound);

    let withThis = (opts, opt, defval) => {
      let tt = opts[opt] ?? defval;
      if (tt === 0) return null;
      if (tt === BIND.M) return this;
      if (tt === BIND.R) return proxy ?? this.proxy ?? this.target;
      if (tt === BIND.T) return this.target;
      
      console.debug('bind:withThis', {opt, defval, methods, opts});
      throw new RangeError(`Invalid '${opt}' option`);
    }    

    for (let key of keys) {
      let {fn, opts} = this.bound[key];

      let ctx = withThis(opts, 'useThis', BIND.M);
      let args = [ctx];

      ctx = withThis(opts, 'passFirst', BIND.R);
      if (ctx) {
        args.push(ctx);
      }

      ps[key] = fn.bind(...args);
    }
  }

}

const BIND = Object.freeze({
  M: 1,
  P: 2,
  R: 2,
  T: 3,
});

Object.defineProperty(ProxyManager, 'BIND', { value: BIND });

module.exports = { ProxyManager }

/**
 * Context info for _getter_ and _setter_ functions.
 * @typedef {object} module:@lumjs/core/proxy~AccessorCtx
 * @prop {ProxyManager} manager - The ProxyManager instance.
 * @prop {('get'|'set')} op - The accessor operation being handled.
 * @prop {(string|symbol)} prop - The property name/key.
 * @prop {(object|function)} receiver - The Proxy receiver object.
 * @prop {(object|function)} target - The underlying target object.
 */

/**
 * A _getter_ function for an accessor property.
 * @callback module:@lumjs/core/proxy~GetterFun
 * @param {module:@lumjs/core/proxy~AccessorCtx} ctx
 * @returns {*} The accessor property value.
 */

/**
 * A _setter_ function for an accessor property.
 * @callback module:@lumjs/core/proxy~SetterFun
 * @param {*} value - The value being assigned to the property.
 * @param {module:@lumjs/core/proxy~AccessorCtx} ctx
 * @returns {(boolean|null|undefined)} 
 * 
 * If the setter function returns `true`, it indicates success of the
 * property assigment and the JS runtime will continue normally.
 * 
 * If the setter function explicitly returns `false` then it is up to
 * the JS runtime how to handle failed assignments, but many will throw
 * a TypeError, so keep that in mind when writing your setter functions.
 * 
 * If the setter function does not return a value, or explicitly returns
 * `null` or `undefined`, it will be handled the same as `true`.
 * 
 * I think in 99% of cases not returning anything is the best.
 */

/**
 * Extended descriptor rule.
 * @typedef {object} module:@lumjs/core/proxy~Desc
 * @prop {(function|undefined)} bind - A bound method handler.
 * 
 * If this property is set, then the rest of the descriptor
 * properties may be used as options for the `bind()` method.
 * 
 * @prop {(function|undefined)} get - A getter function.
 * 
 * If this property is set, then it will be passed to `addAccessor()`,
 * along with the `set` property.
 * 
 * @prop {(function|undefined)} set - A setter function.
 * 
 * If this property is set, then it will be passed to `addAccessor()`,
 * along with the `get` property.
 * 
 * @prop {*} value - A direct property value.
 * 
 * All of the direct property values will be used to build an object
 * that will be passed to `addProps()`.
 * 
 */
