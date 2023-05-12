const types = require('../types');
const {F, S, B, needType, needObj, isObj, notNil, def} = types;

// Default method names we don't want to include.
const DEFAULT_FILTER_NAMES =
[
  'constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 
  'toString', 'toLocaleString', 'valueOf',
];

// Default method prefixes we don't want to include.
const DEFAULT_FILTER_PREFIXES = ['_', '$'];

class MethodFilter
{
  constructor(opts, ...args)
  {
    if (typeof opts === B)
    { // A simple way of specifying defaults mode.
      opts = {defaults: opts};
    }
    else if (!isObj(opts) || opts instanceof RegExp)
    { // Something other than options was passed.
      if (notNil(opts))
        args.unshift(opts);
      opts = {};
    }

    const defaults = opts.defaults ?? true;
    this.returns   = opts.returns  ?? !defaults;

    this.names    = defaults ? Array.from(DEFAULT_FILTER_NAMES)    : [];
    this.prefixes = defaults ? Array.from(DEFAULT_FILTER_PREFIXES) : [];
    this.tests    = [];
    this.rules    = [];

    for (const arg of args)
    {
      this.add(arg);
    }
  }

  add(arg)
  {
    if (typeof arg === S)
    {
      if (arg.length === 1)
      {
        this.prefixes.push(arg);
      }
      else 
      {
        this.names.push(arg);
      }
    }
    else if (typeof arg === F)
    {
      this.tests.push(arg);
    }
    else if (arg instanceof RegExp)
    {
      this.rules.push(arg);
    }
    else 
    {
      console.error("Unsupported argument", arg, this);
    }
    return this;
  }

  test(elem)
  {
    const rt = this.returns;
    const rf = !rt;

    if (this.prefixes.includes(elem[0])) return rt;
    if (this.names.includes(elem)) return rt;

    for (const rule of this.rules)
    {
      if (rule.test(elem)) return rt;
    }

    for (const test of this.tests)
    {
      if (test.call(this, arguments)) return rt;
    }
    
    return rf;
  }

  for(obj)
  {
    return getMethods(obj, this);
  }
}

def(MethodFilter)
  ('DEFAULT_FILTER_NAMES',    DEFAULT_FILTER_NAMES)
  ('DEFAULT_FILTER_PREFIXES', DEFAULT_FILTER_PREFIXES)

function getMethods(obj, filter)
{
  needObj(obj, true);

  if (!(filter instanceof MethodFilter))
  {
    if (Array.isArray(filter))
    {
      filter = new MethodFilter(...filter);
    }
    else
    {
      filter = new MethodFilter(filter);
    }
  }

  const props = new Set();
  let cur = obj;
  do
  {
    Object.getOwnPropertyNames(cur)
      .filter(i => filter.test(i))
      .map(i => props.add(i));
  }
  while ((cur = Object.getPrototypeOf(cur)));
  return [...props.keys()].filter(i => typeof obj[i] === F);
}

def(getMethods, 'exclude', function()
{ // Get a MethodFilter using defaults (exclude mode).
  return new MethodFilter(true, ...arguments);
});

def(getMethods, 'include', function()
{ // Get a MethodFilter using include mode (no defaults).
  return new MethodFilter(false, ...arguments);
})

function signatureOf(fn, name)
{
  needType(F, fn);
  const fns = fn.toString(); 
  const fnt = fns.slice(0, fns.indexOf(')')+1);
  return (typeof name === S) ? fnt.replace('function', name) : fnt;
}

module.exports =
{
  getMethods, signatureOf, MethodFilter,
}
