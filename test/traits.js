"use strict";

const plan = 24;
const t = require('@lumjs/tests').new({module,plan});
const {S,F,O,isObj,def,TYPES} = require('../lib/types');
const 
{
  Trait,compose,composeFully,decompose,getComposed,
} = require('../lib/traits');

class TraitOne extends Trait
{
  hello(name)
  {
    if (isObj(name)) 
      name = name.name;
    if (typeof name === S)
      name = ' '+name;
    else
      name = '';

    const hi = this.sayHi ?? 'Hello';
    const myName = this.name ?? 'not important';
    const introduce = this.introduction ?? 'my name is';

    return `${hi}${name}, ${introduce} ${myName}.`;
  }
}

/*
class TraitTwo extends Trait
{
  goodbye(name)
  {
    if (isObj(name)) 
      name = name.name;
    if (typeof name === S)
      name = ' '+name;
    else
      name = '';
    const bye = this.sayBye ?? 'Goodbye';
    return bye+name+'!';
  }
}
*/

class ClassOne
{
  constructor(name, greeting, useDef=false)
  {
    this.name = name;
    if (greeting)
    {
      if (useDef)
        def(this, 'sayHi', greeting);
      else 
        this.sayHi = greeting;
    }
  }
}

class ClassTwo
{
  constructor(name)
  {
    this.name = name;
  }

  get sayHi()
  {
    return 'Bonjour';
  }

  get sayBye()
  {
    return 'Au revoir';
  }

  get introduction()
  {
    return "je m'appelle";
  }
}

let subjects, lastSubject;

function resetSubjects()
{
  subjects = 
  [
    new ClassOne(),
    new ClassOne('Lisa'),
    new ClassOne('Bob', 'Hey'),
    new ClassOne('Sam', "'sup", true),
    new ClassTwo('Karl'),
    new ClassTwo('Fran'),
  ];

  def(subjects[5], 'sayHi', 'Salut');
  resetLast();
}

function resetLast()
{
  lastSubject = subjects[subjects.length-1];
}

resetSubjects();

t.isa(getComposed(ClassOne, TraitOne), TYPES.NIL, 
  'getComposed(classConstructor, trait) before composing trait');
t.isa(ClassOne.prototype.hello, TYPES.NIL, 
  'class.hello before composing trait');
t.ok((lastSubject.hello === undefined), 
  'object#hello does not exist before composing trait');

function run(testFn)
{
  for (let i=0; i < subjects.length; i++)
  {
    const curSubject = subjects[i];
    testFn(curSubject, i);
    lastSubject = curSubject;
  }
}

run((s) => compose(s, TraitOne));

let expected =
[
  'Hello Fran, my name is not important.',
  'Hello, my name is Lisa.',
  'Hey Lisa, my name is Bob.',
  '\'sup Bob, my name is Sam.',
  'Bonjour Sam, je m\'appelle Karl.',
  'Salut Karl, je m\'appelle Fran.',
];

t.isa(getComposed(lastSubject, TraitOne), O, 'getComposed(object, trait)');
t.isa(lastSubject.hello, F, 'object.hello function defined');

run((s,i) => t.is(s.hello(lastSubject), expected[i], 'object.hello:'+i));

resetSubjects();

t.ok((lastSubject.hello === undefined), 'object.hello does not exist after reset');

compose(ClassOne, TraitOne);
TraitOne.composeInto(ClassTwo);

t.isa(getComposed(ClassOne, TraitOne), [O], 'getComposed(classConstructor, trait)');

t.isa(getComposed(lastSubject, TraitOne), [O], 'getComposed(classInstance, trait)');
t.isa(lastSubject.hello, [F], 'classInstance.hello function defined');

run((s,i) => t.is(s.hello(lastSubject), expected[i], 'class.hello:'+i));

decompose(ClassOne, TraitOne);
TraitOne.decomposeFrom(ClassTwo);

t.ok((getComposed(ClassOne, TraitOne).proto === null), 
  'getComposed(classConstructor, trait) after decompose()');

t.ok((ClassOne.prototype.hello === undefined), 
  'class.prototype.hello does not exist after decomposing trait');

resetSubjects();

t.isa(lastSubject.hello, [TYPES.NIL], 'object.hello does not exist after decomposing trait');

// TODO: static composition, and more outlier cases.

// We're done here.
return t.done();
