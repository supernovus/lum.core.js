// Current test count.
const plan = 26;
// A new test instance.
const t = require('@lumjs/tests').new({module, plan});
// The def() function
const {def} = require('../lib/types');

let obj = {};
def(obj, 'test1', 'Test 1');
t.is(obj.test1, 'Test 1', 'def(obj, name, value)');
def(obj)('test2', 'Test 2');
t.is(obj.test2, 'Test 2', 'def(obj)(name, value)');
obj.test2 = '2 Test';
t.is(obj.test2, 'Test 2', 'def() is read-only by default');

def(obj, true)('test3', 'Test 3');
t.is(Object.keys(obj).length, 1, 'def(obj, true)(...)');

def(obj, 'a1', function()
{ // Returning a different property.
  return this.test2;
},
function(val)
{ // Assigning to a different property.
  this.$$ = val;
});

const gs = 'def(obj, name, getter, setter)';
t.is(obj.a1, 'Test 2', gs+'~getter');
obj.a1 = 'A1->$$';
t.is(obj.$$, 'A1->$$', gs+'~setter');

def(obj, 'test4', 'Test 4', {writable: true});
t.is(obj.test4, 'Test 4', 'def(..., {writable}) → added property');
obj.test4 = '4 Test';
t.is(obj.test4, '4 Test', ' ^ and it was writable');

let td = def(obj);
td('getOnly', {get: function() { return 'GETTER'; }});
obj.getOnly = 'blah blah blah';
t.is(obj.getOnly, 'GETTER', 'def(..., {get: getter}) → getter worked');
td('setOnly', {set: function(val) { this.__ = val; }});
obj.setOnly = 'SETTER';
t.is(obj.__, 'SETTER', 'def(..., {set: setter}) → setter worked');
t.is(obj.setOnly, undefined, ' ^ get is undefined');

td('foobar', {value: 'FOO BAR'});
t.is(obj.foobar, 'FOO BAR', 'def(..., {value})');

let anObj = {value: 'BAR FOO'};
td('barfoo', anObj, false);
t.is(obj.barfoo, anObj, 'def(..., descriptor, false) → assigned object as value');

td('barfoo2', anObj);
t.is(anObj.configurable, true, 'def(..., descriptor) → descriptor is a reference');

anObj = {value: 'new test'};
td('barfoo3', anObj, true);

t.is(anObj.configurable, undefined, 'def(..., descriptor, true) → cloned descriptor');
t.is(obj.barfoo3, 'new test', ' ^ value was correct')

td(
{
  hello: 'World',
  goodbye: 'Universe',
});

t.ok((obj.hello === 'World' && obj.goodbye === 'Universe'), 'def(obj, {prop1: value1, prop2: value2})')

// Reset the object for some new tests.
const td2 = 'def(obj,null,true)';
obj = {};
anObj = {value: 'World'};
td = def(obj, null, true);
let tda = '(k,v,def.e.not.c)';
td('hello', anObj, def.e.not.c);
t.is(obj.hello, 'World', td2+tda+' assignment');
t.is(anObj.enumerable, true, td2+tda+' is enumerable');
t.is(anObj.configurable, false, td2+tda+' is not configurable');

tda = '(k, def.e.val(v))';
td('goodbye', def.e.val('Universe'));
t.is(obj.goodbye, 'Universe', td2+tda+' assignment');

tda = '(k, def.is.val(gfn,sfn))';
td('title', def.is.val(() => 'Hello', function(v) { this.subtitle = v; }));
t.is(obj.title, 'Hello', td2+tda+' getter');
obj.title = 'Foo';
t.is(obj.subtitle, 'Foo', td2+tda+' setter');
t.is(obj.title, 'Hello', td2+tda+' getter not overwritten');

const getd = Object.getOwnPropertyDescriptor;
tda = '.e(k,v)';
td.e('more', 'orLess');
t.is(obj.more, 'orLess', td2+tda+' assignment');
let desc = getd(obj, 'more');
t.is(desc.enumerable, true, td2+tda+' is enumerable');

// All done.
t.done();
