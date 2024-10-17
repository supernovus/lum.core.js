/**
 * Composed property maps.
 * 
 * @typedef {object} module:@lumjs/core/traits~Composed
 * 
 * @prop {?Map} proto  - Map of composed *prototype* properties.
 * 
 * Keys are the `string` or `symbol` for each composed property.
 * Values are {@link module:@lumjs/core/traits~ComposedProperty} objects.
 * 
 * If no applicable trait properties are currently composed,
 * this will be `null`.
 * 
 * @prop {?Map} static - Map of composed *static* properties.
 * 
 * Exactly the same description as `proto`, but for static properties.
 * 
 * @prop {boolean} forClass - Are these property maps from a class?
 * 
 * Will be `true` if the original target was a `function`, or `false`
 * otherwise. Only really useful when trait functions need to be called
 * differently depending on if the trait was applied to an individual
 * instance or a class constructor.
 * 
 */

/**
 * Composed property definitions.
 * 
 * @typedef {object} module:@lumjs/core/traits~ComposedProperty
 * 
 * @prop {(string|Symbol)} id - The property key on the `target`
 * @prop {(string|Symbol)} [srcKey] The property key from the `source`;
 * only included if different from `propKey`.
 * 
 * @prop {?object} newDescriptor - The property descriptor to be added;
 * will be `null` if the property did not exist.
 * 
 * @prop {object} [oldDescriptor] The replaced property descriptor;
 * only included if there was an existing property in the `target` 
 * and the `opts.overwrite` option was `true`.
 * 
 * @prop {boolean} found - Was the property found in the `source` ?
 * @prop {boolean} added - Was the property added to the `target` ?
 * 
 */

/**
 * Trait Registry Interface
 * 
 * This descrives the properties and methods added to the objects used
 * with the {@link module:@lumjs/core/traits.makeRegistry} function.
 * 
 * All of the non-constructor function properties are copies bound to
 * the registry object, and always pass the registry as the first argument.
 * 
 * @typedef {object} module:@lumjs/core/traits~Registry
 * @prop {function} Trait - {@link module:@lumjs/core/traits.Trait Trait constructor}
 * @prop {function} getTrait - {@link module:@lumjs/core/traits.getTrait}
 * @prop {function} getTraits - {@link module:@lumjs/core/traits.getTraits}
 * @prop {function} registerTrait - {@link module:@lumjs/core/traits.registerTrait}
 */

