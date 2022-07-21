// Current test count.
const plan = 85;
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

t.ok(types.isInstance(typesInstance, TypeClass), 'isInstance(typeInstance,TypeClass)');
t.ok(types.isInstance(subtypeInstance, SubtypeClass), 'isInstance(subtypeInstance, SubtypeClass)');
t.ok(types.isInstance(subtypeInstance, TypeClass), 'isInstance(subtypeInstance, TypeClass)');
t.ok(!types.isInstance(typesInstance, SubtypeClass), '!isInstance(typeInstance, SubtypeClass');

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

{ // Try a few versions of 'def'
  const obj = {};
  types.def(obj, 'test1', 'Test 1');
  t.is(obj.test1, 'Test 1', 'def(obj, name, value)');
  types.def(obj)('test2', 'Test 2');
  t.is(obj.test2, 'Test 2', 'def(obj)(name, value)');
  
  // TODO: new accessor assignment options.

}

// TODO: isa() and needs()
// TODO: stringify()

// All done.
t.output();

