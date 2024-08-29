/**
 * Object property copying utilities
 * @module @lumjs/core/obj/cp
 */
"use strict";

const {S,F,def,isObj,isComplex,isArray,isNil} = require('../types');

/**
 * A type handler definition for `obj.cp` operations.
 * 
 * Contains a test to see if the specified subject is
 * applicable to this handler, and methods to perform 
 * specific operations on any applicable subjects.
 * 
 * Any method marked with "**has-default**" means that when
 * created with the `Types.self.make()` or `Types.self.add()` 
 * methods, a default version will be assigned if it wasn't 
 * found in the passed definition object.
 * 
 * @typedef {object} module:@lumjs/core/obj/cp~Typ
 * @prop {module:@lumjs/core/obj/cp~TypTest} test
 * @prop {module:@lumjs/core/obj/cp~TypNew} new
 * @prop {module:@lumjs/core/obj/cp~TypClone} clone **has-default**
 * @prop {module:@lumjs/core/obj/cp~TypCp} cp **has-default**
 * @prop {module:@lumjs/core/obj/cp~TypGetProps} getProps **has-default**
 * @prop {module:@lumjs/core/obj/cp~TypExtend} [extend] **has-default**
 */

/**
 * Test if a given subject is handled by the definition
 * @callback module:@lumjs/core/obj/cp~TypTest
 * @param {object} subject - Subject to be cloned
 * @returns {boolean} If subject passes the test
 */

/**
 * Function to create a new empty object of a specific type
 * @callback module:@lumjs/core/obj/cp~TypNew
 * @param {module:@lumjs/core/obj/cp~Context} [ctx] - API Context
 * @returns {object} New empty object
 */

/**
 * Function to perform a _shallow clone_ for a specific type.
 * 
 * The defalt version calls `this.new()` to get an new empty object,
 * then calls `Object.assign(new, subject)` to populate the clone.
 * Which works fine for basic objects, but may not be suitable for
 * more advanced types.
 * 
 * @callback module:@lumjs/core/obj/cp~TypClone
 * @param {object} subject - Subject to be cloned
 * @param {module:@lumjs/core/obj/cp~Context} [ctx] - API Context
 * @returns {object} Shallow clone of subject
 */

/**
 * Function to _shallow copy_ properties into an object.
 * 
 * The default version uses `Object.assign()`, which is great for most
 * objects, but may have unexpected side effects with certain types.
 * 
 * @callback module:@lumjs/core/obj/cp~TypCp
 * @param {object} target - Object being copied into
 * @param {Array} sources - Source objects to copy into target
 * @param {module:@lumjs/core/obj/cp~Context} [ctx] - API Context
 * @returns {object} The `target` after copying has completed
 */

/**
 * Function to get property descriptors for values in an object.
 * 
 * The default version uses `Object.getOwnPropertyDescriptors()`;
 * if `ctx.opts.all` is `true` it returns the full list,
 * otherwise it returns only the enumerable properties.
 * 
 * @callback module:@lumjs/core/obj/cp~TypGetProps
 * @param {object} subject - Subject to get properties from
 * @param {module:@lumjs/core/obj/cp~Context} [ctx] - API Context
 * @returns {object} See `Object.getOwnPropertyDescriptors()`,
 * as the return value format must match that function.
 */

/**
 * Optional function to do advanced copying of all sources into a target.
 * @callback module:@lumjs/core/obj/cp~TypCopyAll
 * @param {module:@lumjs/core/obj/cp~Context} [ctx] - API Context;
 * will have `target` property set.
 * @param {Array} sources - Sources to copy into target.
 * @returns {void}
 */

/**
 * Optional function to do advanced copying of a source into a target.
 * @callback module:@lumjs/core/obj/cp~TypCopyOne
 * @param {module:@lumjs/core/obj/cp~Context} [ctx] - API Context;
 * will have `target` and `source` properties set.
 * @returns {void}
 */

/**
 * Create a new type handler using an existing one as a template.
 * 
 * @callback module:@lumjs/core/obj/cp~TypExtend
 * @param {...object} defs - Properties to compose into new def.
 * 
 * Any properties passed in these objects will replace the ones
 * from the template type def. We're using `Object.assign()`,
 * so there's no type-checking or overwrite protection. Use with care!
 * 
 * @returns {module:@lumjs/core/obj/cp~Typ} A new type def object.
 */

/**
 * Handler called every time a Context object is updated.
 * 
 * It can examine the update state, and modify options or
 * any other properties in the context object as desired.
 *
 * @callback module:@lumjs/core/obj/cp~OnUpdate
 * @param {object} ctx - API Context which has been updated
 * @param {...object} data - Data passed to update method
 * 
 * On creation of a Context, there will be two arguments,
 * the previous Context if there was one, and the data sent
 * to the constructor.
 * 
 * For calls to update on an existing Context there will generally 
 * only be one data object passed.
 * 
 * @returns {void}
 */

/**
 * A full set of type handlers for `cp`.
 * 
 * @extends {Set}
 * @alias module:@lumjs/core/obj/cp.HandlerSet
 */
class TypeHandlerSet extends Set
{
  /**
   * Add a type handler to this set.
   * @param {module:@lumjs/core/obj/cp~Typ} type
   * 
   * May alternatively be another `HandlerSet` instance,
   * in which case all the type handlers in it will be added.
   * 
   * @returns {module:@lumjs/core/obj/cp.HandlerSet} `this`
   * @throws {TypeError} If `typedef` is not valid.
   */
  add(value)
  {
    if ($TD.is(value))
    {
      return super.add(value);
    }
    else if (value instanceof TypeHandlerSet)
    {
      for (const th of value)
      {
        super.add(th);
      }
    }
    else
    {
      console.debug({value, set: this});
      throw new TypeError("Invalid TypeDef object");
    }
  }

  /**
   * Find the handler for a given subject.
   * 
   * If no explicit handler in this set supports the subject,
   * the special `object` handler will be returned as a default.
   * 
   * This method caches the result for each `subject` so that
   * future requests don't have to run any tests.
   * 
   * @param {object} subject
   * @returns {module:@lumjs/core/obj/cp~Typ}
   */
  for(subject)
  {
    if (this.subCache === undefined)
    {
      def(this, 'subCache', new Map());
    }

    if (this.subCache.has(subject))
    {
      return this.subCache.get(subject);
    }

    for (const def of this)
    {
      if (def.test(subject))
      { // Found one.
        this.subCache.set(subject, def);
        return def;
      }
    }

    // No specific handler found, use the default.
    this.subCache.set(subject, TD.object);
    return TD.object;
  }

  /**
   * Clears the subject cache used by `for()`
   */
  clearCache()
  {
    if (this.subCache instanceof Map)
    {
      this.subCache.clear();
    }
  }

} // TypeHandlerSet class

/**
 * Metadata and API methods for `cp.Types`
 * @alias module:@lumjs/core/obj/cp.Types.self
 */
const $TD =
{
  /**
   * Property names that will be skipped by `Types.for()` method
   */
  SKIP_FOR: ['for','object','self','Handlers'],
  /**
   * Property names reserved for HandlerSet getter properties in `Types`
   */
  DEF_SETS: ['all','default'],
  /**
   * Mandatory methods (function properties) in a valid type handler.
   */
  NEED_FNS: ['test','new','clone','cp','getProps'],

  /**
   * Default type handler functions used by `make()` function
   */
  DEFAULTS:
  {
    clone(o) {return Object.assign(this.new(), o)},
    cp: (o,s) => Object.assign(o, ...s),
    getProps(o,c)
    {
      const ap = Object.getOwnPropertyDescriptors(o)
      if (c?.opts?.all) return ap;

      const ep = {};
      for (const p in ap)
      {
        if (ap[p].enumerable)
        {
          ep[p] = ap[p];
        }
      }
      return ep;
    },
    extend()
    {
      return Object.assign({}, this, ...arguments);
    },
  },

  /**
   * An array of reserved property names in `Types`;
   * consists of `SKIP_FOR` and `DEF_SETS` combined.
   */
  get reserved()
  {
    return $TD.DEF_SETS.concat($TD.SKIP_FOR);
  },

  /**
   * An array of the absolute minimum _required_ methods that **MUST** 
   * be included when calling `make()` or `add()`.
   * 
   * It's `NEED_FNS` excluding any functions provided in `DEFAULTS`.
   */
  get requirements()
  {
    const defs = Object.keys($TD.DEFAULTS);
    return $TD.NEED_FNS.filter(v => !defs.includes(v));
  },

  /**
   * Make a new type handler definition
   * 
   * @param {object} indef - Properties/functions for the handler
   * 
   * Must contain at least functions for `test` and `new`.
   * Any other mandatory functions will fallback on default versions.
   * 
   * @return {module:@lumjs/core/obj/cp~Typ}
   * @throws {TypeError} If any required properties/functions are missing.
   */
  make(indef)
  {
    const outdef = Object.assign({}, $TD.DEFAULTS, indef);
    if (!$TD.is(outdef))
    {
      console.debug({indef, outdef, required: $TD.requirements});
      throw new TypeError("Type handler is missing requirements");
    }
    return outdef;
  },

  /**
   * Add a new _named_ type handler (or HandlerSet) to `cp.Types`
   * 
   * @param {string} name - Name for the new type or set
   * 
   * For types, the lowercase classname is generally a safe choice.
   * Examples: `set`, `map`, `element`, `nodelist`, etc.
   * 
   * May not be any name in the `reserved` list.
   * 
   * @param {object} indef - See `make()` for details
   * 
   * @returns {module:@lumjs/core/obj/cp.Types.self}
   * So you can chain multiple .add() calls together.
   * 
   * @throws {RangeError} If `name` was a reserved value
   * @throws {TypeError} See `make()` for details
   * @see module:@lumjs/core/obj/cp.Types.self.make
   */
  add(name, indef)
  {
    if ($TD.reserved.includes(name))
    {
      throw new RangeError(name+' is a reserved property name');
    }
    TD[name] = $TD.make(indef);
    return this;
  },

  /**
   * Is a value a valid type handler definition for `cp`?
   * @param {*} v - Value to test
   * @returns {boolean}
   * @see module:@lumjs/core/obj/cp~Typ
   */
  is(v)
  {
    if (!isObj(v)) return false;

    for (const need of $TD.NEED_FNS)
    {
      if (typeof v[need] !== F)
      {
        return false;
      }
    }

    return true;
  },
}

/**
 * Type handler definitions for specific types of objects
 * that require special handling when cloning or composing.
 * 
 * @alias module:@lumjs/core/obj/cp.Types
 */
const TD =
{
  /**
   * Handler for `object`
   * 
   * This is a special implicit handler and does NOT need to *ever*
   * be explicitly added to a `HandlerSet`, as it's always used as
   * the *default fallback* if no other type handler matches.
   */
  object: $TD.make(
  {
    test: () => true, 
    new:  () => {},
  }),

  /**
   * Handler for `Array`
   * 
   * It's `new()` method returns `[]`, and it's `clone()` method
   * uses `subject.slice()` as a simple shallow array clone.
   * 
   * No other array-specific behaviour is implemented in this very
   * basic type handler, however it would be easy enough to extend
   * it to add custom functionality (such as appending all sources
   * into the subject for example).
   * 
   * @type {module:@lumjs/core/obj/cp~Typ}
   */
  array: $TD.make(
  {
    test:  isArray, 
    new:  () => [],
    clone: v => v.slice(),
  }),

  /**
   * Assemble a complete Type Handler set
   * 
   * @param  {...(string|object)} types - Type handlers to include
   * 
   * If this is a `string` it must be the name of a type handler
   * property registered with the `Types` object itself.
   * 
   * If this is an `object`, it must implement the
   * {@link module:@lumjs/core/obj/cp~Typ} interface.
   * 
   * @returns {module:@lumjs/core/obj/cp.HandlerSet}
   * @throws {TypeError} If any of the `types` are not valid.
   */
  for(...types)
  {
    const defset = new TypeHandlerSet();

    for (const type of types)
    { // First we'll add specified handlers.
      if (typeof type === S 
        && !$TD.SKIP_FOR.includes(type)
        && (type in this))
      { // The name of one of our registered types.
        defset.add(this[type]);
      }
      else if (type !== TD.object)
      { // If it isn't a valid TypeDef, a TypeError will be thrown.
        defset.add(type);
      }
    }

    return defset;
  },

  /**
   * A getter for the default handler set that will be used
   * if one is not specified; supports only `array` and `object`.
   * 
   * @type {module:@lumjs/core/obj/cp.HandlerSet}
   */
  get default()
  {
    return new TypeHandlerSet([this.array]);
  },

  /**
   * A getter for a handler set with *all* of our registered
   * type handlers included in it. 
   * 
   * Unless another library like `@lumjs/web-core` has added 
   * extra type handlers, this will end up being the same as 
   * `default` at this point in time.
   * 
   * @type {module:@lumjs/core/obj/cp.HandlerSet}
   */
  get all()
  {
    const types = Object.keys(this)
      .filter((name) => !$TD.reserved.includes(name))
      .map((name) => this[name]);
    return new TypeHandlerSet(types);
  },

} // TypeDefs

// Used by cp() and cp.safe()
function cpArgs(subject, ...sources)
{
  let handlers;
  if (subject instanceof TypeHandlerSet)
  { 
    handlers = subject;
    subject = sources.shift();
  }
  else
  {
    handlers = TD.default;
  }

  const args = {subject, sources, handlers};

  if (!isComplex(subject))
  {
    console.debug("Invalid subject", args);
    args.invalid = true;
    return args;
  }

  args.th = handlers.for(subject);

  return args;
}

/**
 * Simple (shallow) object copying
 * 
 * @param {module:@lumjs/core/obj/cp~Handlers} [handlers] Type handlers
 * 
 * This optional parameter may be specified before the `subject`,
 * in which case it will determine which type handlers will be supported.
 * 
 * If not specified, a default set of handlers will be used.
 * 
 * @param {object} subject - Subject of the copy operation
 * 
 * If this is specified as the _sole argument_, then it indicates we
 * want a shallow _clone_ of the subject.
 *
 * If you need to include *all* properties (not just *enumerable* ones),
 * or need to do any kind of recursion or other advanced features, you'll
 * need to use the declarative API. e.g. `cp.from(subject).all.clone()`
 * 
 * @param  {...object} [sources] Sources to copy into the subject
 * 
 * The default handlers use `Object.assign()` to copy properties from 
 * each source into the subject. Which may have odd results if used
 * with certain kinds of objects.
 * 
 * Like with cloning, if you need any advanced features, you'll need to
 * use the declarative API. e.g. `cp.into(target).ow.deep.from(source)`
 * 
 * @returns {object}
 * @alias module:@lumjs/core/obj/cp.cp
 * 
 * **Note**: this is the actual `obj.cp` default export value, 
 * but to keep JSDoc happy it is available as a named export.
 */
function cp()
{
  const args = cpArgs(...arguments);
  if (args.invalid) return args.subject;

  const {subject,sources,th} = args;

  if (sources.length === 0)
  { // No arguments, we're gonna make a shallow clone.
    return th.clone(subject);
  }

  // Do a shallow copy.
  return th.cp(subject, sources);
} // cp()

cp.Types      = TD;
cp.HandlerSet = TypeHandlerSet;

/**
 * Make a clone of an object using JSON
 * 
 * Serialize an object to JSON, then parse it back into an object.
 * It's a ridiculously simple method for simple _deep_ cloning,
 * but comes with many limitations inherent to JSON serialization.
 * 
 * @param {object} obj - Object to clone
 * @param {object} [opts] Advanced options 
 * @param {function} [opts.replace] A JSON _replacer_ function
 * @param {function} [opts.revive] A JSON _reviver_ function
 * 
 * @returns {object} A clone of the `obj`
 * 
 * @alias module:@lumjs/core/obj/cp.json
 */
cp.json = function(obj, opts={})
{
  if (!isObj(obj))
  {
    console.warn("cp.json() does not support non-object");
    return obj;
  }

  return JSON.parse(JSON.stringify(obj, opts.replace), opts.revive);
}

/**
 * Copy new enumerable properties into a subject.
 * 
 * Where the default `cp()` function will overwrite properties,
 * this version does not. It will only copy properties that
 * don't already exist.
 * 
 * @param {object} subject 
 * @param  {...object} sources 
 * @returns {object} `subject`
 */
cp.safe = function()
{
  const args = cpArgs(...arguments);
  if (args.invalid) return args.subject;

  const {subject} = args;

  for (const src of args.sources)
  {
    const props = args.th.getProps(src);
    for (const prop in props)
    {
      if (subject[prop] === undefined)
      {
        const desc = props[prop];
        def(subject, prop, desc);
      }
    }
  }

  return subject;
} // cp.safe()

const DEFAULT_CPAPI_OPTS =
{
  all: false,
  overwrite: true,
  recursive: 0,
  toggleDepth: -1,
  proto: false,
}

const VALIDATION =
{
  handlers: v => v instanceof TypeHandlerSet,
  onUpdate: v => typeof v === F,
}

for (const opt in DEFAULT_CPAPI_OPTS)
{ // Generate some default validation rules based on type values.
  if (VALIDATION[opt] === undefined)
  {
    const vt = typeof DEFAULT_CPAPI_OPTS[opt];
    VALIDATION[opt] = v => typeof(v) === vt;
  }
}

const CPAPI_TOGGLE_OPTS = ['deep','safe','ow'];

/**
 * Context object for use in the declarative API.
 * 
 * May have additional properties added by `opts.onUpdate()` if used.
 * This documentation lists only standard properties that will be
 * used without any custom options.
 * 
 * Properties marked with **¿** will only be included when applicable.
 * 
 * Properties marked with **¡** may be set automatically when applicable.
 * Currently that only applies to type handlers, which will be looked
 * up using `opts.handler.for()` as a convenience shortcut.
 * 
 * @prop {module:@lumjs/core/obj/cp.API} cp - API instance
 * @prop {object} opts - Current options; defaults to `cp.opts`
 * @prop {number} depth - Current recusion depth (`0` is top-level)
 * @prop {?object} prev - Previous context (if applicable)
 * 
 * Will be `null` unless if `opts.recusive` is not `0` and the
 * context is for a nested operation (top-level will always be `null`).
 * 
 * @prop {object} [target] Current target **¿**
 * @prop {object} [source] Current source **¿**
 * @prop {number} [ti] Current target index **¿**
 * @prop {number} [si] Current source index **¿**
 * @prop {module:@lumjs/core/obj/cp~Typ} [th] Handler for `target` **¡**
 * @prop {module:@lumjs/core/obj/cp~Typ} [sh] Handler for `source` **¡**
 * 
 * @prop {(string|symbol)} [prop] Property being operated on **¿**
 * @prop {object} [td] Target descriptor for `prop` **¿**
 * @prop {object} [sd] Source descriptor for `prop` **¿**
 * 
 * @alias module:@lumjs/core/obj/cp~Context
 */
class CPContext
{
  /**
   * Build a new Context object.
   * 
   * Generally this is only called by the `cp.getContext()` API method.
   * 
   * This will call `this.update(prev, data)` after setting
   * `this.cp` and `this.opts` to their default values.
   * 
   * Lastly it sets `this.prev` overwriting any previous value.
   * 
   * @param {module:@lumjs/core/obj/cp.API} api - API instance
   * @param {object} data - Initial data
   * @param {?module:@lumjs/core/obj/cp~Context} prev - Previous context
   */
  constructor(api, data, prev)
  {
    this.cp = api;
    this.opts = api.opts;
    this.depth = 0;
    this.update(prev, data);
    this.prev = prev;
  }

  /**
   * Update the context with new data
   * 
   * Will automatically populate certain properties depending on
   * the data added.
   * 
   * @param {...object} data - Properties to add to the context
   * 
   * Nothing is 
   * 
   * @returns {object} `this`
   */
  update()
  {
    Object.assign(this, ...arguments);

    if (typeof this.opts.onUpdate === F)
    {
      this.opts.onUpdate(this, ...arguments);
    }

    if (this.target && !this.th)
    {
      this.th = this.opts.handler.for(this.target);
    }

    if (this.source && !this.sh)
    {
      this.sh = this.opts.handler.for(this.source);
    }

    return this;
  }

  /**
   * Set context options
   *
   * It makes a _new object_ composing the original `this.opts` and `changes`,
   * and sets that to `this.opts`. It does not change the original opts object.
   * 
   * This is meant to be called from custom `onUpdate` handler functions,
   * and isn't actually used by anything in the library itself.
   * 
   * @param {object} changes - Any option values you want to change.
   * 
   * @returns {object} `this`
   */
  setOpts(changes)
  {
    this.opts = Object.assign({}, this.opts, changes);
    return this;
  }

} // CPContext class

cp.Context = CPContext;

/**
 * A class providing a declarative API for advanced `obj.cp` API calls.
 * 
 * This is based off of the earlier `copyProps` declarative API,
 * and is meant to replace it entirely in future releases of this library.
 * 
 * @alias module:@lumjs/core/obj/cp.API
 */
class CPAPI
{
  /**
   * Create a declarative `obj.cp` API instance.
   * 
   * You generally would never call this directly, but use one of the
   * functions in `cp` instead, a few examples:
   * 
   * ```js
   * // Copy properties recursively, allowing overwrite
   * cp.into(target).ow.deep.from(source);
   * 
   * // Clone an object, including all (not just enumerable) properties
   * let cloned = cp.from(obj).all.clone();
   * 
   * ```
   * 
   * @param {(object|function)} [opts] Options
   * 
   * If this is a `function` it will be used as the `opts.onUpdate` value.
   * 
   * If this is a {@link module:@lumjs/core/obj/cp.HandlerSet} object,
   * it will be used as the `opts.handlers` value.
   * 
   * @param {module:@lumjs/core/obj/cp.HandlerSet} [opts.handlers]
   * Specific type handlers to use with this API instance.
   * 
   * If not specified, the default set will be used.
   * 
   * @param {boolean} [opts.all=false] Include all properties?
   * 
   * If `false` (default), we'll only use *enumerable* properties.
   * If `true` we'll include *all* property descriptors in the subject.
   * 
   * @param {boolean} [opts.overwrite=true] Overwrite existing properties?
   * 
   * @param {boolean} [opts.proto=false] Copy prototype?
   * 
   * If `true`, the prototype on each target will be set to the
   * prototype of the first source. This is `false` by default.
   * 
   * @param {number} [opts.recursive=0] Recurse into nested objects?
   * 
   * - `0`   → disables recursion entirely (default)
   * - `> 0` → specify depth recursion should be allowed
   * - `< 0` → unlimited recursion depth
   * 
   * When recursion is enabled, we will cache nested objects that we've
   * already processed, so we don't get stuck in an infinite loop.
   * 
   * @param {number} [opts.toggleDepth=-1] This is the recursion depth 
   * that will be used when the `deep` toggle value is `true`.
   * 
   * @param {function} [opts.onUpdate] A custom function
   */
  constructor(opts={})
  {
    if (typeof opts === F)
    {
      opts = {onUpdate: opts, handlers: TD.default};
    }
    else if (opts instanceof TypeHandlerSet)
    {
      opts = {handlers: opts};
    }
    else if (!(opts.handlers instanceof TypeHandlerSet))
    {
      opts.handlers = TD.default;
    }

    this.opts = Object.assign({}, DEFAULT_CPAPI_OPTS);
    this.set(opts);

    this.sources = [];
    this.targets = [];
    this.$ocache = [];

    this.nextToggle = true;
  }

  /**
   * Get a context object to pass to type handler methods
   * @param {object} data - Initial data for the context object
   * @param {object} [prev] A previous context object (if applicable)
   * @returns {module:@lumjs/core/obj/cp~Context}
   */
  getContext(data, prev=null)
  {
    return new CPContext(this, data, prev);
  }

  /**
   * Use specific type handlers or a custom context onUpdate function.
   * 
   * @param {(module:@lumjs/core/obj/cp.HandlerSet|function)} arg
   * 
   * If this is a `function`, we will set `opts.onUpdate` using it. 
   * Otherwise we will set `opts.handlers`.
   * 
   * @returns {object} `this`
   * @throws {TypeError} If `arg` is invalid
   */
  use(arg)
  {
    const opt = typeof arg === F ? 'onUpdate' : 'handlers';
    return this.set({[opt]: arg}, true);
  }

  /**
   * The next *toggle accessor property* will be set to `false`.
   * 
   * This only affects the very next toggle, after which the
   * toggle value will return to its default value of `true`.
   * 
   * You need to explicitly use `not` before each toggle property
   * that you want to turn off instead of on.
   */
  get not() 
  {
    this.nextToggle = false;
    return this;
  }

  /**
   * Private method that handles all *toggle properties*.
   * @private
   * @param {string} opt - Name of option to toggle
   * @param {*} [trueVal=true] Value to use if toggle is `true`
   * @param {*} [falseVal=false] Value to use if toggle is `false`
   * @returns {object} `this`
   */
  $toggle(opt, trueVal=true, falseVal=false)
  {
    this.opts[opt] = this.nextToggle ? trueVal : falseVal;
    this.nextToggle = true;
    return this;
  }

  /**
   * Toggle `opts.all` with boolean value when accessed
   */
  get all()
  {
    return this.$toggle('all');
  }

  /**
   * Toggle `opts.overwrite` with boolean value when accessed
   */
  get ow()
  {
    return this.$toggle('overwrite');
  }

  /**
   * Toggle `opts.overwrite` with *reversed value* when accessed
   * 
   * The value to set will be the reverse of the toggle value:
   * 
   * `true`  → `opts.overwrite = false`
   * `false` → `opts.overwrite = true`
   * 
   */
  get safe()
  {
    return this.$toggle('overwrite', false, true);
  }

  /**
   * Toggle `opts.recursive` when accessed
   * 
   * Value to set depends on the toggle value:
   * 
   * `true`  → `opts.recursive = opts.toggleDepth`
   * `false` → `opts.recursive = 0`
   * 
   */
  get deep()
  {
    const max = this.opts.toggleDepth;
    if (max === 0) console.error("toggleDepth is 0", {cp: this});
    return this.$toggle('recursive', max, 0);
  }

  /**
   * Set specified options
   * @param {object} opts - Options to set
   * @param {boolean} [fatal=false] Throw on invalid type?
   * 
   * By default we report invalid option values to the console,
   * and simply skip setting the invalid option. 
   * 
   * If this is `true` any invalid option values will result in
   * an error being thrown, ending the entire `set()` process.
   * 
   * @returns {object} `this`
   * @throws {TypeError} See `fatal` argument for details
   */
  set(opts, fatal=false)
  {
    if (isObj(opts))
    {
      for (const opt in opts)
      {
        if (opt in VALIDATION)
        {
          if (!VALIDATION[opt](opts[opt]))
          {
            const msg = 'invalid option value';
            const info = {opt, opts, cp: this};
            if (fatal)
            {
              console.error(info);
              throw new TypeError(msg);
            }
            else
            {
              console.error(msg, info);
              continue;
            }
          }
        }
        else if (opt in CPAPI_TOGGLE_OPTS)
        { 
          if (!opts[opt])
          { // Negate the toggle.
            this.not;
          }
          // Now toggle it.
          this[opt];
          continue;
        }

        this.opts[opt] = opts[opt];
      }
    }
    else
    {
      console.error("invalid opts", {opts, cp: this});
    }
    return this;
  }

  /**
   * Specify the `targets` to copy properties into.
   * 
   * @param {...object} [targets] The target objects
   * 
   * If you don't specify any targets, then `this.targets`
   * will be cleared of any existing objects.
   * 
   * If `this.sources` has objects in it, then we'll copy
   * those sources into each of the specified targets.
   * 
   * If `this.sources` is empty, then this will set
   * `this.targets` to the specified value.
   * 
   * @returns {object} `this`
   */
  into(...targets)
  {
    if (this.sources.length > 0 && targets.length > 0)
    {
      this.$runAll(this.sources, targets);
    }
    else 
    {
      this.targets = targets;
    }
    return this;
  }

  /**
   * Specify the `sources` to copy properties from.
   * 
   * @param  {...object} [sources] The source objects.
   * 
   * If you don't specify any sources, then `this.sources`
   * will be cleared of any existing objects.
   * 
   * If `this.targets` has objects in it, then we'll copy 
   * the specified sources into each of those targets.
   * 
   * If `this.targets` is empty, then this will set
   * `this.sources` to the specified value.
   * 
   * @returns {object} `this`
   */
  from(...sources)
  {
    if (this.targets.length > 0 && sources.length > 0)
    {
      this.$runAll(sources, this.targets);
    }
    else 
    {
      this.sources = sources;
    }
    return this;
  }

  /**
   * See if we can use EZ mode.
   * 
   * EZ-mode is a shortcut to use `cp()` or `cp.safe()`
   * to perform copy operations if applicable.
   */
  get isEZ()
  {
    const o = this.opts;
    return (!o.all && !o.recursive);
  }
  
  /**
   * Clone the properties of the sources into a new object.
   * 
   * This will only with if `cp.into()` was used to create the
   * API instance. It will throw an error if `cp.from()` was used.
   * 
   * This gets the type handler for the first source, uses it
   * to get a new object, then runs the copy operation with the
   * new object as the sole target.
   * 
   * @returns {object} A new object
   */
  clone()
  {
    if (this.targets.length > 0)
    {
      console.debug(this);
      throw new RangeError("cannot clone when targets set");
    }

    if (this.sources.length === 0)
    {
      console.debug(this);
      throw new RangeError("cannot clone with no sources");
    }

    // Get the type handler for the first source.
    const sh = this.opts.handlers.for(this.sources[0]);
    const target = sh.new()

    this.$runAll(this.sources, [target]);

    return target;
  }

  /**
   * Run a copy operation for the specified sources and targets.
   * 
   * For _each target_, it will find the type handler, then do one of:
   * 
   * - If `this.isEZ` is `true`, calls `cp()` to perform the operation,
   *   and no further processing will be required.
   * 
   * - If the type handler has a `copyAll()` method,
   *   that will be called, passing the `sources` array
   *   in its entirety.
   * 
   * - If the type handler instead has a `copyOne()` method,
   *   that will be called once for each source.
   * 
   * - If the handler has neither of those, then `this.$runOne()`
   *   will be called once for each source.
   * 
   * @private
   * @param {Array} sources 
   * @param {Array} targets 
   * @returns {void}
   */
  $runAll(sources, targets)
  {
    const ez = this.isEZ;
    for (const ti in targets)
    {
      const target = targets[ti];

      if (ez)
      { // EZ mode, use one of the simple functions.
        const hdl = this.opts.handlers;
        const fun = this.opts.overwrite ? cp : cp.safe;
        fun(hdl, target, ...sources);
      }
      else
      { // Advanced mode supports many more options.
        const ctx = this.getContext({target,ti});
        const {th} = ctx;
        if (typeof th.copyAll === F)
        { // Type handler will handle all sources at once.
          th.copyAll(ctx, sources);
        }
        else
        { // One source at a time.
          const isHandled = (typeof th.copyOne === F);
          for (const si in sources)
          {
            const source = sources[si];
            ctx.update({source,si});

            if (isHandled)
            {
              th.copyOne(ctx);
            }
            else
            {
              this.$runOne(ctx);
            }
          }
        }
      }
    }
  } // $runAll()

  /**
   * Run a copy operation from a single source into a single target.
   * This is called by `$runAll()`, and also calls itself recursively
   * if `opts.recursive` is not set to `0` (its default value).
   * 
   * @private
   * @param {module:@lumjs/core/obj/cp~Context} ctx - Context;
   * must have both `target` and `source` properties defined.
   * @returns {void}
   */
  $runOne(rctx)
  {
    const {target,source,th,sh} = rctx;
    const sprops = sh.getProps(source, rctx);
    const tprops = th.getProps(target, rctx);

    const cache = this.$ocache;

    for (const prop in sprops)
    {
      const sd = sprops[prop];
      let   td = tprops[prop];
      
      const pctx = this.getContext({prop,sd}, rctx);
      const po = pctx.opts;
      
      if ((po.recursive < 0 || (po.recursive > pctx.depth))
        && isObj(sd.value)
        && !cache.includes(sd.value)
        && (!isObj(td)
          || (isObj(td.value) && !cache.includes(td.value))
        )
      )
      { // A nested object was found.
        cache.push(sd.value);
        if (sd.value !== td?.value)
        { // Not the same literal object.
          if (isObj(td))
          {
            pctx.update({td});
          }
          if (!isObj(td))
          { // Create a new descriptor.
            const value = th.new();
            td = Object.assign({}, sd, {value});
            pctx.update({td});
            def(target, prop, pctx.td);
          }

          cache.push(td.value);

          pctx.update(
          { // New source and target; ensure the handlers are rebuilt.
            sh: null, th: null,
            source: sd.value, 
            target: td.value,
            depth: pctx.depth+1,
          });

          this.$runOne(subctx);
        }
      }
      else if (po.overwrite || td === undefined)
      {
        def(target, prop, pctx.sd);
      }
    }

    if (rctx.si === 0 && rctx.opts.proto)
    { // Prototype assignment only done with first source.
      const sp = Object.getPrototypeOf(source);
      const tp = Object.getPrototypeOf(target);
      if (sp && sp !== tp)
      { // Apply the source prototype to the target.
        Object.setPrototypeOf(target, sp);
      }
    }

  } // $runOne()

} // CPAPI class

cp.API = CPAPI;

/**
 * Create a new `cp` declarative API instance with the specified options.
 * @param {(function|object)} opts - Passed to the constructor
 * @returns {module:@lumjs/core/obj/cp.API} API instance
 * @alias module:@lumjs/core/obj/cp.with
 */
cp.with = function(opts)
{
  return new CPAPI(opts);
}

/**
 * Create a new `cp` declarative API instance with default options,
 * and the specified target objects.
 * @param {...objects} targets - Target objects
 * @returns {module:@lumjs/core/obj/cp.API} API instance
 * @alias module:@lumjs/core/obj/cp.into
 */
cp.into = function()
{
  return (new CPAPI()).into(...arguments);
}

/**
 * Create a new `cp` declarative API instance with default options,
 * and the specified source objects.
 * @param {...objects} source - Source objects
 * @returns {module:@lumjs/core/obj/cp.API} API instance
 * @alias module:@lumjs/core/obj/cp.from
 */
cp.from = function()
{
  return (new CPAPI()).from(...arguments);
}

/**
 * A wrapper around `cp` specifically for cloning.
 * 
 * @param {object} obj - Object to clone
 * 
 * @param {?object} [opts] Options
 * 
 * If this is an `object`, the clone call will be:
 * `cp.with(opts).into(obj).clone();`
 * 
 * If this is `null` or `undefined`, the call will be: 
 * `cp(obj);`
 * 
 * @returns {object} `obj`
 * @alias module:@lumjs/core/obj/cp.clone
 */
cp.clone = function(obj, opts)
{
  if (isNil(opts))
  { 
    return cp(obj);
  }
  else
  {
    return cp.with(opts).into(obj).clone();
  }
}

/**
 * Add a clone() method to an object.
 * 
 * The method added is pretty simple with a very basic signature:
 * `obj.clone(opts)`, and it calls `cp.clone(obj,opts);`
 * 
 * @param {object} obj - Object to add method to
 * @param {object} [spec] Optional spec
 * @param {string} [spec.name='clone'] Method name to add;
 * Default: `clone`
 * @param {object} [spec.desc] Descriptor rules
 * @param {?object} [spec.opts] Default options for method;
 * Default is `null` so that simple cloning is the default.
 * 
 * @returns {object} `obj`
 * @alias module:@lumjs/core/obj/cp.addClone
 */
function addClone(obj, spec={})
{
  const name = spec.name ?? 'clone';
  const desc = spec.desc ?? {};
  const defs = spec.opts ?? null;

  desc.value = function(opts)
  {
    if (isObj(defs) && opts !== null)
    {
      opts = Object.assign({}, defs, opts);
    }

    return cp.clone(obj, opts);
  }

  return def(obj, name, desc);
}

cp.addClone = addClone;

/**
 * A singleton object offering cached `cp.API` instances.
 * @alias module:@lumjs/core/obj/cp.cache
 */
cp.cache =
{
  /**
   * Return a `cp` instance with a single `target` object.
   * 
   * Will cache the instance the first time, so future calls
   * with the same `target` will return the same instance.
   * 
   * @param {object} target 
   * @returns {module:@lumjs/core/obj/cp.API}
   */
  into(target)
  {
    if (this.intoCache === undefined)
      this.intoCache = new Map();
    const cache = this.intoCache;
    if (cache.has(target))
    {
      return cache.get(target);
    }
    else
    {
      const api = cp.into(target);
      cache.set(target, api);
      return api;
    }
  },
  /**
   * Return a `cp` instance with a single `source` object.
   * 
   * Will cache the instance the first time, so future calls
   * with the same `target` will return the same instance.
   * 
   * @param {object} source 
   * @returns {module:@lumjs/core/obj/cp.API}
   */
  from(source)
  {
    if (this.fromCache === undefined)
      this.fromCache = new Map();
    const cache = this.fromCache;
    if (cache.has(source))
    {
      return cache.get(source);
    }
    else
    {
      const api = cp.from(source);
      cache.set(source, api);
      return api;
    }
  },
  /**
   * Clear the caches for `into` and `from`.
   * @returns {object} `cp.cache`
   */
  clear()
  {
    if (this.intoCache)
      this.intoCache.clear();
    if (this.fromCache)
      this.fromCache.clear();
    return this;
  },
} // cp.cache

// Export everything, including self reference.
module.exports = cp.cp = cp;
