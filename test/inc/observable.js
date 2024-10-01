"use strict";

const plan = 42;
const observable = require('../../lib/observable');
const isObs = observable.is;
const {O,F,TYPES,isObj} = require('../../lib/types');
const isLock = Object.isFrozen;

function run(t, makeObs=observable, testOpts={})
{
  const osArg = testOpts.appendEvent ? 1 : 0;

  // A container object with helpers for our testing.
  const test = 
  {
    opts: {},
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
      if (isObj(opts))
        this.opts = opts;
      this.obj = isObs(data) ? data : makeObs(data, this.opts);
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

  test.new();

  t.isa(test.obj.on,      F, test.name+' .on() exists');
  t.isa(test.obj.off,     F, test.name+' .off() exists');
  t.isa(test.obj.one,     F, test.name+' .one() exists');
  t.isa(test.obj.trigger, F, test.name+' .trigger() exists')
  
  test.on('test', function()
  {
    const name = test.name;
    t.is(arguments.length, (1+osArg), name+' args count');
    t.is(arguments[0], 'Hello World', name+' arg value');
    t.is(this, test.obj, name+' this is target object');
    t.is(this.isObservable, undefined, name+' this.isObservable is undefined');
  }).trigger('test', 'Hello World');
  
  test.on('test2', function()
  {
    const name = test.name;
    t.is(arguments.length, (2+osArg), name+' args count');
    t.is(arguments[0], 'Hello', name+' arg value');
  }).trigger('test2', 'Hello', 'World');
  
  test.new({},{wrapargs: true})
    .on('test', function()
    {
      const name = test.name;
      t.is(this, test.obj, name+' this is target object');
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
  
  test.new({},{wrapthis: true})
    .on('test', function()
    {
      const name = test.name;
      t.isnt(this, test.obj, name+' this is NOT target object');
      t.ok(isLock(this), name+' this is locked');
      t.is(arguments.length, 2, name+' arg count');
      t.is(arguments[1], 'World', name+' arg value');
      t.isa(this.isObservable, O, name+' this.isObservable is an object');
      t.is(this.isObservable.event, true, name+' this.isObservable.event is true');
      t.is(this.isObservable.target, false, name+' this.isObservable.target is false');
      const self = this.self;
      t.isa(self, O, name+' this.self is an object');
      t.is(self, test.obj, name+' self is target object'); 
      t.isa(self.isObservable, O, name+' self.isObservable is an object');
      t.is(self.isObservable.event, false, name+' self.isObservable.event is false');
      t.is(self.isObservable.target, true, name+' self.isObservable.target is true');    
    }).trigger('test', 'Hello', 'World');
  
  test.new({},{wrapthis: true, wrapargs: true})
    .on('test', function()
    {
      const name = test.name;
      t.isnt(this, test.obj, name+' this is NOT target object');
      t.is(arguments.length, 1, name+' arg count');
      const arg = arguments[0];
      t.isa(arg, O, name+' arg type');
      t.is(arg, this, name+' arg is this');
      t.is(this.self, test.obj, name+' this.self is target object');
    }).trigger('test');
  
}

module.exports =
{
  observable, isObj, plan, run,
}
