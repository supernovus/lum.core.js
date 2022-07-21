const def = require('./def');
const {O, F, S, B, N, U, SY, BI} = require('./js');
const 
{
  isObj, isComplex, isNil, notNil, isScalar, isArray, isTypedArray,
  isArguments, isProperty, doesDescriptor,
} = require('./basics');

/**
 * A map of **Types**, including *special* and *union* types.
 * 
 * Contains the same `O, F, S, B, N, U, SY, BI` properties as also
 * found in the top-level {@link module:@lumjs/core/types} module.
 * While most of the core JS types simply use `typeof` as their
 * test, this maps the `O` (`object`) type to the `isObj` test.
 * 
 * Will also contain a few helper functions, and a map of tests
 * that are used by `isType`, `isa`, `needType`, and `needs`.
 * Any one of these properties may be passed to those functions as
 * the desired *type* a desired value must be.
 * 
 * We will list the types added by the `types` module in
 * the *Properties* table, and any types added by other *core modules*
 * in the *Members* list, prior to listing the *Methods*.
 * 
 * @namespace module:@lumjs/core/types.TYPES
 * @property {string} NULL - Represents `null` values.
 * @property {string} ARGS - Represents an *argument* object.
 * @property {string} PROP - A `string` or a `symbol`.
 * @property {string} ARRAY - An `Array` object.
 * @property {string} TYPEDARRAY - A `TypedArray` object.
 * @property {string} DESCRIPTOR - A *Descriptor* object (Data or Accessor). 
 * @property {string} COMPLEX - A `function` or an `object`.
 * @property {string} SCALAR - A non-null value that is **not** *complex*.
 * @property {string} NIL - Either `null` or `undefined`.
 * @property {string} NOTNIL - Anything other than `null` or `undefined`.
 * @property {string} MAP - A `Map` object.
 * @property {object} tests - A map of tests for the above types.
 */
 const TYPES = {};

 /**
  * Add a new type to the `TYPES`.
  * @name module:@lumjs/core/types.TYPES.add
  * @function
  * @param {(string|object)} name - If a `string` the property name to use.
  *   When adding the property the string will be forced to uppercase.
  * 
  *   If an `object` then its a shortcut for adding a bunch of types at once.
  *   Each key will be the `name`, and the type of the *value* can be one of:
  *   - `string` → Use as the `ident` parameter.
  *   - `function` → Use as the `test` parameter.
  *   - `object` → Supports `id`, `test`, and `export` parameters.
  * 
  * @param {?string} [ident] The identifier string for the type.
  *   If not specified or `null`, it will default to a completely lowercase 
  *   version of the `name` parameter.
  * @param {function} [test] A type check test.
  *   Must accept a single value to test, must return a boolean.
  * @param {string} [exportTest] A name to export the test as.
  *   The test will be added to the `types` module with this name.
  * 
  * @returns {void}
  */

 /**
  * Get a list of type properties available in `TYPES`.
  * @name module:@lumjs/core/types.TYPES.keys
  * @function
  * @returns {string[]}
  */

  /**
  * Get a list of type identifier values available in `TYPES`.
  * @name module:@lumjs/core/types.TYPES.list
  * @function
  * @returns {string[]}
  */

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
 