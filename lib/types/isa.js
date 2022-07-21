const {O, F, S} = require('./js');
const {isObj} = require('./basics');
const TYPES = require('./typelist');

/**
 * See if a value is an instance of a class.
 * @param {*} v - The value we're testing.
 * @param {function} f - The constructor/class we want.
 * @param {boolean} [needProto=false] If true, the `v` must have a `prototype`.
 * @returns {boolean}
 * @alias module:@lumjs/core/types.isInstance
 */
 function isInstance(v, f, needProto=false) 
 {
   if (!isObj(v)) return false; // Not an object.
   if (needProto && (typeof v.prototype !== O || v.prototype === null))
   { // Has no prototype.
     return false;
   }
 
   if (typeof f !== F || !(v instanceof f)) return false;
 
   // Everything passed.
   return true;
 }
 
 exports.isInstance = isInstance;

 /**
  * A smarter `typeof` function.
  * 
  * @param {string} type - The type we're checking for.
  * 
  * This supports all the same type names as `typeof` plus any of
  * the properties defined in the `TYPES` object.
  * 
  * One other thing, while `typeof` reports `null` as being an `object`,
  * this function does not count `null` as a valid `object`. 
  * 
  * @param {*} v - The value we're testing. 
  * @returns {boolean} If the value was of the desired type.
  * @alias module:@lumjs/core/types.isType
  */
 function isType(type, v)
 {
   if (typeof type !== S || !TYPES.list.includes(type))
   {
     throw new TypeError(`Invalid type ${JSON.stringify(type)} specified`);
   }
 
   if (typeof TYPES.tests[type] === F)
   { // A type-specific test.
     return TYPES.tests[type](v);
   }
   else 
   { // No type-specific tests.
     return (typeof v === type);
   }
 }
 
 exports.isType = isType;

 // Default options parser.
 const DEFAULT_ISA_PARSER = function(type, v)
 { // `this` is the options object itself.
   if (typeof type.is === F)
   { // We assume `is()` methods are the type check.
     if (type.is(v)) return true;
   }
 
   if (typeof type.isa === O)
   { // Process our known options.
     const opts = type.isa;
 
     if (typeof opts.process === F)
     { // We'll pass the current `opts` as well as the `v` to this method.
       // It doesn't return anything on its own, but can assign further tests,
       // which by default only apply to `object` 
       opts.process(this, v);
     }
 
     if (typeof opts.parsers === F)
     { // Assign another parser.
       this.parsers.push(opts.parsers);
     }
 
     if (typeof opts.test === F)
     { // A custom test, will be passed `v` and the current `opts`.
       if (opts.test(v, this))
       { // Mark this as having passed.
         return true;
       }
     }
 
     // Okay, now anything else gets set.
     const RESERVED = ['parsers','process','test'];
     for (const opt in opts)
     {
       if (RESERVED.includes(opt)) continue; // Skip it.
       this[opt] = opts[opt];
     }
 
   }
 
   // We should almost always return false.
   return false;
 }
 
 /**
  * Is value a certain type, or an instance of a certain class.
  * 
  * @param {*} v - The value we're testing.
  * @param {...any} types - The types the value should be one of.
  * 
  * For each of the `types`, if it is a `string` we test with `isType()`,
  * if it is a `function` we test with `isInstance()`. 
  * 
  * If it is an `object` and has an `is()` method, use that as the test.
  * 
  * If it is an `object` it will be passed to the current options parsers.
  * The default options parser looks for an `object` property called `isa`,
  * which supports the following child properties:
  * 
  *  - `needProto: boolean`, Change the `needProto` option for `isInstance()`
  *  - `parsers: function`, Add another options parser function.
  *  - `process: function`, A one-time set-up function.
  *  - `test: function`, Pass the `v` to this test and return `true` if it passes.
  *  - Anything else will be set as an option.
  * 
  * Any other type value will only match if `v === type`
  * 
  * @returns {boolean} Was the value one of the desired types?
  * @alias module:@lumjs/core/types.isa
  */
 function isa(v, ...types)
 {
   // A special options object.
   const opts =
   {
     needProto: false,
     parsers:
     [
       DEFAULT_ISA_PARSER,
     ],
     process(type, v)
     {
       for (const parser of this.parsers)
       {
         if (typeof parser === F)
         {
           if (parser.call(this, type, v) === true)
           { // Returning true means a custom test passed.
             return true;
           }
         }
       }
       return false;
     },
   }
 
   for (const type of types)
   {
     // First a quick test for absolute equality.
     if (v === type) return true;
 
     // With that out of the way, let's go!
     if (typeof type === S)
     { // A string is passed to isType()
       if (isType(type, v)) return true;
     }
     else if (typeof type === F)
     { // A function is passed to isInstance()
       if (isInstance(v, type, opts.needProto)) return true;     
     }
     else if (isObj(type))
     { // Objects can be additional tests, or options.
       if (opts.process(type, v)) return true;
     }
 
   }
 
   // None of the tests passed. We have failed.
   return false;
 }

 exports.isa = isa;
