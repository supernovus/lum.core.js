// Current test count.
const plan = 106;
// A new test instance.
const t = require('@lumjs/tests').new({module, plan});
// The types core module
const types = require('../lib/types');
// Our console wrapper singleton
const LC = require('../lib/console');

// A quick reference to the type names.
const TYP = types.TYPES;
// And the stringify function.
const stringify = require('@lumjs/describe');

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
t.ok(types.nonEmptyArray([1,2,3]), 'nonEmptyArray([1,2,3])');
t.ok(!types.nonEmptyArray([]), '!nonEmptyArray([])');
t.ok(types.isProperty('hi'), 'isProperty(string)');
t.ok(types.isProperty(Symbol('hi')), 'isProperty(Symbol)');
t.ok(!types.isProperty(false), '!isProperty(false)');

{ // Some isTypedArray tests
  const ab = new ArrayBuffer(2);
  t.ok(types.isTypedArray(new Uint8Array(8)), 'isTypedArray(Uint8Array)');
  t.ok(types.isTypedArray(new Float32Array(4)), 'isTypedArray(Float32Array)');
  t.ok(!types.isTypedArray(ab), '!isTypedArray(ArrayBuffer)');
  t.ok(!types.isTypedArray(new DataView(ab)), '!isTypedArray(DataView)');
}

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

LC.muted(() => { // TODO: Deprecated tests will be removed in 2.x
  t.ok(types.isInstance(typesInstance, TypeClass), 'isInstance(typeInstance,TypeClass)');
  t.ok(types.isInstance(subtypeInstance, SubtypeClass), 'isInstance(subtypeInstance, SubtypeClass)');
  t.ok(types.isInstance(subtypeInstance, TypeClass), 'isInstance(subtypeInstance, TypeClass)');
  t.ok(!types.isInstance(typesInstance, SubtypeClass), '!isInstance(typeInstance, SubtypeClass)');
  t.ok(!types.isInstance(differentInstance, TypeClass), '!isInstance(differentInstance, TypeClass)');
  t.ok(!types.isInstance(typesInstance, DifferentClass), '!isInstance(typesInstance, DifferentClass)');
});

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
  LC.mute();
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
  LC.restore();
}

/** 
 * TODO:
 * - isIterable
 * - isPlainObject
 * - isClassObject
 * - isDiscreteObject
 * - doesDescriptorTemplate
 */

// TODO: add `types-isa.js` file covering `isa` and `needs` functions.

// All done.
t.done();
