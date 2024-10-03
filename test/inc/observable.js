"use strict";

const plan = 42;
const {O,F,TYPES} = require('../../lib/types');
const isLock = Object.isFrozen;

// A container object with helpers for our testing.
const ot = 
{
  opts: null,
  addOpts: null,
  makeObs: null,
  arg3: null,
  obj: null,
  objCount: 0,
  onCount: 0,
  triggerCount: 0,

  get name() 
  { 
    return `[${this.objCount}:${this.onCount}]`; // ,${this.triggerCount}
  },

  new(data={}, opts)
  {
    const obs = this.makeObs;
    this.opts = Object.assign({}, this.addOpts, opts);
    this.obj = obs.is(data) ? data : obs(data, this.opts, this.arg3);
    this.objCount++;
    this.onCount = 0;
    this.triggerCount = 0;
    return this;
  },

  on() 
  { 
    this.onCount++;
    this.triggerCount = 0;
    this.obj.on(...arguments);
    return this;
  },

  trigger()
  {
    this.triggerCount++;
    this.obj.trigger(...arguments);
    return this;
  },

}

function run(t, observable, testOpts={})
{
  const osArg = testOpts.appendEvent ? 1 : 0;
  ot.makeObs = observable;
  ot.arg3 = testOpts.arg3 ?? null;
  ot.addOpts = testOpts.add ?? {};

  ot.new();

  t.isa(ot.obj.on,      F, ot.name+' .on() exists');
  t.isa(ot.obj.off,     F, ot.name+' .off() exists');
  t.isa(ot.obj.one,     F, ot.name+' .one() exists');
  t.isa(ot.obj.trigger, F, ot.name+' .trigger() exists')
  
  ot.on('test', function()
  {
    const name = ot.name;
    t.is(arguments.length, (1+osArg), name+' args count');
    t.is(arguments[0], 'Hello World', name+' arg value');
    t.is(this, ot.obj, name+' this is target object');
    t.is(this.isObservable, undefined, name+' this.isObservable is undefined');
  }).trigger('test', 'Hello World');
  
  ot.on('test2', function()
  {
    const name = ot.name;
    t.is(arguments.length, (2+osArg), name+' args count');
    t.is(arguments[0], 'Hello', name+' arg value');
  }).trigger('test2', 'Hello', 'World');
  
  ot.new({},{wrapargs: true})
    .on('test', function()
    {
      const name = ot.name;
      t.is(this, ot.obj, name+' this is target object');
      t.ok(!isLock(this), name+' this is NOT locked');
      t.is(arguments.length, 1, name+' args count');
      const arg = arguments[0];
      t.isa(arg, O, name+' arg type');
      t.ok(isLock(arg), name+' event object is locked');
      t.isa(arg.isObservable, O, name+' arg.isObservable is an object');
      t.is(arg.isObservable.event, true, name+' arg.isObservable.event is true');
      t.is(arg.isObservable.target, false, name+' arg.isObservable.target is false')
      t.isa(this.isObservable, O, name+' this.isObservable is an object');
      t.is(this.isObservable.event, false, name+' this.isObservable.event is false');
      t.is(this.isObservable.target, true, name+' this.isObservable.target is true');
      t.is(arg.name, 'test', name+' event name');
      t.is(arg.wildcard, false, name+' arg.wildcard is false');
      t.isa(arg.args, TYPES.ARRAY, name+' arg.args is an array');
      t.is(arg.args[0], 'Hello', name+' arg.args[0] value');
    }).trigger('test', 'Hello', 'World');
  
  ot.new({},{wrapthis: true})
    .on('test', function()
    {
      const name = ot.name;
      t.isnt(this, ot.obj, name+' this is NOT target object');
      t.ok(isLock(this), name+' this is locked');
      t.is(arguments.length, 2, name+' arg count');
      t.is(arguments[1], 'World', name+' arg value');
      t.isa(this.isObservable, O, name+' this.isObservable is an object');
      t.is(this.isObservable.event, true, name+' this.isObservable.event is true');
      t.is(this.isObservable.target, false, name+' this.isObservable.target is false');
      const self = this.self;
      t.isa(self, O, name+' this.self is an object');
      t.is(self, ot.obj, name+' self is target object'); 
      t.isa(self.isObservable, O, name+' self.isObservable is an object');
      t.is(self.isObservable.event, false, name+' self.isObservable.event is false');
      t.is(self.isObservable.target, true, name+' self.isObservable.target is true');    
    }).trigger('test', 'Hello', 'World');
  
  ot.new({},{wrapthis: true, wrapargs: true})
    .on('test', function()
    {
      const name = ot.name;
      t.isnt(this, ot.obj, name+' this is NOT target object');
      t.is(arguments.length, 1, name+' arg count');
      const arg = arguments[0];
      t.isa(arg, O, name+' arg type');
      t.is(arg, this, name+' arg is this');
      t.is(this.self, ot.obj, name+' this.self is target object');
    }).trigger('test');
  
}

module.exports =
{
  plan, run, obsTest: ot,
}
