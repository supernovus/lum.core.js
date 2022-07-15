const def = require('./def');
const {O, F, S, B, N, U, SY, BI} = require('./js');
const 
{
  isObj, isComplex, isNil, notNil, isScalar, isArray, isTypedArray,
  isArguments, isProperty, doesDescriptor,
} = require('./basics');

/**
 * A map of type names including special and union types.
 * Will also contain a few helper functions, and a map of tests
 * for any types that require tests other than `typeof v === 'typename'`
 */
 const TYPES = {};

 // Let's setup the TYPES with its magic functions.
 const dt = def(TYPES);
 dt('tests', {})
   ('keys',
   {
     get()
     {
       return Object.keys(this);
     }
   })
   ('list', 
   {
     get() 
     {
       return Object.values(this);
     }
   })
   ('add', function(name, ident, test, exportTest)
   {
     if (isObj(name))
     { // A shortcut for adding multiple items.
       for (let key in name)
       {
         const val = name[key];
         if (typeof val === S)
         { // It's a 'name': 'ident' mapping.
           TYPES.add(key, val);
         }
         else if (typeof val === F)
         { // It's a 'name': test() mapping.
           TYPES.add(key, null, val);
         }
         else if (isObj(val))
         { // An object, can have 'id', 'test', and 'export' properties.
           TYPES.add(key, val.id, val.test, val.export);
         }
         else 
         { // Unsupported.
           throw new TypeError("Invalid add type property");
         }
       }
     }
     else if (typeof name === S)
     { 
       if (typeof ident !== S)
       { // Use a lowercase version of the name.
         ident = name.toLowerCase();
       }
       // And just to be sure.
       name = name.toUpperCase();
       dt(name, {enumerable: true, value: ident});
       if (typeof test === F)
       { // A custom test, mapped to the ident.
         def(TYPES.tests, ident, test);
         if (typeof exportTest === S && isObj(TYPES.$module))
         { // So extensions can add new type tests.
           TYPES.$module.exports[exportTest] = test;
         }
       }
     }
     else 
     {
       throw new TypeError("Invalid arguments");
     }
   });
 
 // Now we'll actually set up the built-in TYPES.
 TYPES.add(
 {
   // First the simplest ones that just use `typeof`.
   F, S, B, N, U, SY, BI,
   // Next the custom object test, overriding `typeof`.
   O: {id: O, test: isObj},
   // Custom type defs that never had typeof tests.
   NULL: v => (v === null),
   ARGS: {id: 'arguments', test: isArguments},
   PROP: {id: 'property',  test: isProperty},
   ARRAY: isArray,
   TYPEDARRAY: isTypedArray,
   DESCRIPTOR: doesDescriptor,
   COMPLEX: isComplex,
   SCALAR: isScalar,
   NIL: isNil,
   NOTNIL: notNil,
   MAP: v => v instanceof Map,
 });
 
 module.exports = TYPES;
 