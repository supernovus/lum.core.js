// Current test count.
const plan = 120;
// A new test instance.
const t = require('@lumjs/tests').new({module, plan});
// The types core module
const types = require('../lib/types');

// A quick reference to the type names.
const TYP = types.TYPES;
// And the stringify function.
const stringify = types.stringify;

// Now for some further basics.
t.ok(types.isObj({}), 'isObj({})');
t.ok(types.isComplex({}), 'isComplex(object)');
t.ok(types.isComplex(function(){}), 'isComplex(function)');
t.ok(types.isNil(undefined), 'isNil(undefined)');
t.ok(types.isNil(null), 'isNil(null)');
t.ok(types.notNil(true), 'notNil(true)');
t.ok(types.notNil(false), 'notNil(false)');
t.ok(types.notNil(''), "notNil('')");
t.ok(types.isScalar(true), 'isScalar(true)');
t.ok(types.isScalar(0), 'isScalar(0)');
t.ok(!types.isScalar({}), '!isScalar({})');
t.ok(!types.isScalar(null), '!isScalar(null)');
t.ok(types.isArray([]), 'isArray([])');
t.ok(types.isTypedArray(new Int8Array(8)), 'isTypedArray(Int8Array)');
t.ok(types.nonEmptyArray([1,2,3]), 'nonEmptyArray([1,2,3])');
t.ok(!types.nonEmptyArray([]), '!nonEmptyArray([])');
t.ok(types.isProperty('hi'), 'isProperty(string)');
t.ok(types.isProperty(Symbol('hi')), 'isProperty(Symbol)');
t.ok(!types.isProperty(false), '!isProperty(false)')

function getArguments() { return arguments; }

t.ok(types.isArguments(getArguments()), 'isArguments(arguments)');
t.ok(!types.isArguments({}), '!isArguments({})');

class TypeClass 
{
  notUnbound()
  {
    t.ok(!types.unbound(this), '!unbound(instanceThis)');
  }
}

class SubtypeClass extends TypeClass {}

const typesInstance = new TypeClass();
const subtypeInstance = new SubtypeClass();

class DifferentClass {}

const differentInstance = new DifferentClass();

t.ok(types.isInstance(typesInstance, TypeClass), 'isInstance(typeInstance,TypeClass)');
t.ok(types.isInstance(subtypeInstance, SubtypeClass), 'isInstance(subtypeInstance, SubtypeClass)');
t.ok(types.isInstance(subtypeInstance, TypeClass), 'isInstance(subtypeInstance, TypeClass)');
t.ok(!types.isInstance(typesInstance, SubtypeClass), '!isInstance(typeInstance, SubtypeClass)');
t.ok(!types.isInstance(differentInstance, TypeClass), '!isInstance(differentInstance, TypeClass)');
t.ok(!types.isInstance(typesInstance, DifferentClass), '!isInstance(typesInstance, DifferentClass)');

function doesDesc (tests, not=false)
{
  for (const it of tests)
  {
    let result = types.doesDescriptor(it);
    if (not) result = !result;
    const desc = (not?'!':'')+'doesDescriptor'+stringify(it)+')';
    t.ok(result, desc);
  }
}

doesDesc(
[
  {value: true},
  {value: {}, writable: true},
  {get: function(){}},
  {set: function(){}},
  {get: function(){}, set: function(){}},
  {get: function(){}, configurable: true},
]);

doesDesc(
[
  {},
  {value: true, get: function(){}},
  {value: true, set: function(){}},
  {get: function(){}, writable: true},
  {set: function(){}, writable: true},
], true);

function testIsType (tests, not=false)
{
  for (const it of tests)
  {
    let result = types.isType(it[0], it[1]);
    if (not) result = !result;
    const desc = (it.length > 2) 
      ? it[2] 
      : (it[0]+','+stringify(it[1]));
    t.ok(result, (not?'!':'')+'isType('+desc+')');
  }
}

testIsType(
[
  [TYP.O, {}],
  [TYP.F, function(){}],
  [TYP.S, 'hello'],
  [TYP.B, true],
  [TYP.B, false],
  [TYP.N, 100],
  [TYP.U, undefined],
  [TYP.SY, Symbol('foo'), TYP.SY+',Symbol'],
  [TYP.BI, BigInt(12345), TYP.BI+',BigInt(12345)'],
  [TYP.BI, 54321n, TYP.BI+',54321n'],
  [TYP.ARGS, getArguments()],
  [TYP.ARRAY, []],
  [TYP.NULL, null],
  [TYP.TYPEDARRAY, new Int16Array(16), TYP.TYPEDARRAY+',Int16Array(16)'],
  [TYP.DESCRIPTOR, {value: true}],
  [TYP.DESCRIPTOR, {get: function(){}}],
  [TYP.COMPLEX, {}],
  [TYP.COMPLEX, function(){}],
  [TYP.SCALAR, true],
  [TYP.SCALAR, 'hi'],
  [TYP.PROP, 'woah'],
  [TYP.PROP, Symbol('woah')],
]);

testIsType(
[
  [TYP.O, 'foo'],
  [TYP.O, null],
  [TYP.F, {}],
  [TYP.B, 0],
  [TYP.B, 1],
  [TYP.N, '0'],
  [TYP.U, null],
  [TYP.SY, 'foo'],
  [TYP.BI, 12345],
  [TYP.ARGS, {}],
  [TYP.ARRAY, {}],
  [TYP.NULL, false],
  [TYP.TYPEDARRAY, []],
  [TYP.DESCRIPTOR, {value: true, get: function(){}}],
  [TYP.DESCRIPTOR, {}],
  [TYP.COMPLEX, 'a string'],
  [TYP.SCALAR, {}],
  [TYP.PROP, null],
], true);

(function(){ t.ok(types.unbound(this), 'unbound(unboundThis)'); })();
(function(){ t.ok(!types.unbound(this), '!unbound(boundThis)') }).bind({})();
typesInstance.notUnbound();

t.ok((function(){types.needObj({}); return true})(), 'needObj({})');
t.dies(function(){types.needObj(null); return true}, '!needObj(null)');

t.ok((function(){types.needType(TYP.S, 'hi'); return true})(), "needType('string','hi')");
t.dies(function(){types.needType(TYP.O, null); return true}, "!needType('object',null)");

{ // Tests of isa() method.
  let wants = [TYP.S, TYP.N];
  t.ok(types.isa('hi', ...wants), 'isa(val, ...types)');
  t.isa('hello', wants, ' ^ using Test.isa()');
  t.isa(42, wants, ' ^ with second type');
  t.ok(!types.isa({}, ...wants), '!isa(val, ...types)');
  t.nota({}, wants, ' ^ using Test.nota()');

  wants = [SubtypeClass, DifferentClass];
  t.isa(subtypeInstance, wants, 'isa(val, ...classes)');
  t.isa(differentInstance, wants, ' ^ with second class');
  t.nota(typesInstance, wants, 'nota(val, ...classes)');

  wants = [TYP.B, TypeClass];
  t.isa(true, wants, 'isa() → with mixed types/classes');
  t.isa(subtypeInstance, wants, ' ^ with second type/class');
}

{ // Tests of needs() method.
  let needs = [TYP.S, TYP.N];
  t.lives(() => types.needs('hi', ...needs), 'needs(val, ...types)');
  t.lives(() => types.needs(42, ...needs), ' ^ with second type');
  t.dies(() => types.needs({}, ...needs), ' ^ throws on failure');

  needs = [SubtypeClass, DifferentClass];
  t.lives(() => types.needs(subtypeInstance, ...needs), 'needs(val, ...classes)');
  t.lives(() => types.needs(differentInstance, ...needs), ' ^ with second class');
  t.dies(() => types.needs(typesInstance, ...needs), ' ^ throws on failure');

  needs = [TYP.B, TypeClass];
  t.lives(() => types.needs(true, ...needs), 'needs() → with mixed types/classes');
  t.lives(() => types.needs(subtypeInstance, ...needs), ' ^ with second type/class');
}

{ // Try a few versions of 'def'
  const obj = {};
  types.def(obj, 'test1', 'Test 1');
  t.is(obj.test1, 'Test 1', 'def(obj, name, value)');
  types.def(obj)('test2', 'Test 2');
  t.is(obj.test2, 'Test 2', 'def(obj)(name, value)');
  obj.test2 = '2 Test';
  t.is(obj.test2, 'Test 2', 'def() is read-only by default');

  types.def(obj, true)('test3', 'Test 3');
  t.is(Object.keys(obj).length, 1, 'def(obj, true)(...)');
  
  types.def(obj, 'a1', function()
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

  types.def(obj, 'test4', 'Test 4', {writable: true});
  t.is(obj.test4, 'Test 4', 'def(..., {writable}) → added property');
  obj.test4 = '4 Test';
  t.is(obj.test4, '4 Test', ' ^ and it was writable');

  const td = types.def(obj);
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
}

// TODO: isa() and needs()
// TODO: stringify()

// All done.
t.done();

