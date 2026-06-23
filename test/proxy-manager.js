'use strict';
const plan = 11;
const t = require('@lumjs/tests').new({ module, plan });
const { ProxyManager } = require('../lib/proxy.js');

let sym = Symbol();
let obj = { 
  adopt: 'Welcome to the adoption agency!',
  children: ['one', 'two', 'three'],
  version: 1,
}
let pm = new ProxyManager(obj, {selfKey: '$manager'});
let ts = new Date();

// Testing the add() method as a frontend to the whole thing.
let res = pm.add({
  define: { bind: Object.defineProperty },      // default bind rules
  kids: { get() { return this.children } },     // getter via `this`
  proxy: { get: ctx => ctx.receiver },          // getter via ctx argument
  adopt: { set(v) { this.children.push(v); } }, // setter-only accessor
  ver: { // duplex accessor using mixed handler methodologies
    get() { return this.version },
    set: (ver, ctx) => { ctx.target.version = ver },
  },
  runtime: { value: ts },                       // explicit value assignment
  initialVer: obj.version,                      // implicit value assignment
  [sym]: ts.getTime(),                          // symbol property
});

let pro = pm.build();

t.is(res, pm, 'add() returned instance');
t.is(pro.$manager, pm, 'selfKey option');
t.is(pro.kids, obj.children, 'getter via `this`');
t.is(pro.proxy, pro, 'getter via `ctx`');

pro.adopt = 'four';
t.is(obj.children.length, 4, 'setter-only accessor');

t.is(pro.ver, 1, 'duplex accessor getter');
pro.ver = 2;
t.is(obj.version, 2, 'duplex accessor setter');

t.is(pro.runtime, ts, 'explicit value assignment');
t.is(pro.initialVer, 1, 'implicit value assigment');
t.is(pro[sym], ts.getTime(), 'symbol property');

res = 'Test';
pro.define('name', {configurable: true, value: res});
t.is(obj.name, res, 'default bind rules');

// TODO: test the more obscure features

// That's all folks!
t.done();
