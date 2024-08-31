const def = require('./def');
const {F} = require('./js');
const {isObj,isProperty} = require('./basics');

const V = Symbol('@lumjs/core/types~dt:V');
const A = Object.freeze(
{
  i: 'is',
  n: 'not',
  e: 'e',
  c: 'c',
  w: 'w',
  v: 'val',
  g: 'getter',
  s: 'setter',
  d: 'desc',
  p: 'dt',
});
const P = Object.freeze(
{
  e: 'enumerable',
  c: 'configurable',
  w: 'writable',
  g: 'get',
  s: 'set',
  v: 'value',
});

/**
 * Build a descriptor template using a simple property syntax.
 * 
 * Generally used via magic properties on the `def` function:
 * 
 * ```js
 * def(o1, 'p1', val1, def.e);     // Add 'enumerable' property.
 * def(o2, 'p2', val2, def.not.c); // Remove 'configurable' status.
 * ```
 * 
 * The supported magic properties are:
 * 
 * | Prop  | Description                                               |
 * | ----- | --------------------------------------------------------- |
 * | `is`  | Make subsequent rule accessors set their value to `true`  |
 * | `not` | Make subsequent rule accessors set their value to `false` |
 * | `c`   | Accessor that sets `configurable` descriptor rule value   |
 * | `e`   | Accessor that sets `enumerable` descriptor rule value     |
 * | `w`   | Accessor that sets `writable` descriptor rule value       |
 * 
 * Similar magic properties may be added to bound instances of `def`;
 * I'll add further docs for that later. Look at the tests for examples.
 * 
 * The constructor function is also available via `def.DT`,
 * but using the built-in properties is easier.
 * 
 * @class
 * @alias module:@lumjs/core/types~DescriptorTemplate
 */
function DescriptorTemplate(opts={})
{
  if (!new.target) return new DescriptorTemplate(opts);
  def(this, V, true);
  def(this, A.d, {value: (isObj(opts.desc) ? opts.desc : this)});
}

const dp = DescriptorTemplate.prototype;

function pa(prop)
{
  return(
  {
    get() 
    { // Set a regular, enumerable, writable value.
      this[A.d][prop] = this[V];
      return this;
    }
  });
}

function va(value)
{
  return(
  {
    get()
    { // Set a hidden, but configurable value. 
      def(this, V, value);
      return this;
    }
  });
}

function af(p)
{
  return function(fn)
  {
    const d = this[A.d];
    delete d[P.v];
    delete d[P.w];
    d[p] = fn;
    return this;
  }
}

def(dp)
  (A.i, va(true))
  (A.n, va(false))
  (A.e, pa(P.e))
  (A.c, pa(P.c))
  (A.w, pa(P.w))
  (A.g, af(P.g))
  (A.s, af(P.s))
  (A.v, function(v1, v2)
  { // A function to set a value with.
    const d = this[A.d];
    if (typeof v2 === F && typeof v1 === F)
    {
      delete d[P.v];
      delete d[P.w];
      d.get = v1;
      d.set = v2;
    }
    else
    {
      delete d.get;
      delete d.set;
      d.value = v1;
    }
    return this;
  })
; // def(dp)

// for addInit()
function na(dp, opts)
{
  return(
  {
    get()
    { 
      const dt = new DescriptorTemplate(opts);
      return dt[dp];
    }
  });
}

// For addInstance()
function ni(ip, dp)
{
  return(
  {
    get()
    { 
      this[ip][dp];
      return this;
    }
  });
}

const DTA = [A.i,A.n,A.e,A.c,A.w];

DescriptorTemplate.addInit = function(target, opts={})
{
  for (const a of DTA)
  {
    def(target, a, na(a, opts));
  }
}

DescriptorTemplate.addInstance = function(target, opts={})
{
  const prop = isProperty(opts.prop) ? opts.prop : A.p;
  const dt = new DescriptorTemplate(opts);

  def(target, prop, {value: dt});

  for (const a of DTA)
  {
    def(target, a, ni(prop, a));
  }

  return target;
}

module.exports = DescriptorTemplate;

/**
 * Set a data value or accessor getter/setter combo.
 * 
 * @function module:@lumjs/core/types~DescriptorTemplate#val
 * 
 * @param {mixed} v1 - Value to assign, or Getter function
 * 
 * This is used as a Getter is if `v2` is also a `function`.
 * In any other case this will assign a data `value` property.
 * 
 * @param {function} [v2] - Setter function
 * 
 * This is only used if `v1` is also a `function`.
 * 
 * @returns {object} `this`
 */
