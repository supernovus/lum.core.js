/**
 * A type handler for `obj.cp` operations.
 * 
 * Type handler definitions are plain objects implementing
 * at least the mandatory methods listed in this interface.
 * 
 * Contains a test to see if the specified subject is
 * applicable to this handler, and methods to perform 
 * specific operations on any applicable subjects.
 * 
 * Methods marked with "**¡**" means that when created with
 * `cp.TY.self.make()`, a default version will be assigned
 * if it wasn't included in the passed definition object.
 * `cp.TY.self.add()` calls `make()` for any incomplete
 * definition, so the defaults will be added there as well.
 * 
 * Methods marked with "**¿**" are optional and not required
 * to exist in order for the handler to be considered valid.
 * 
 * Methods marked with "**‽**" are optional and not required
 * to exist, but also have default versions applied by `make()`.
 * 
 * @typedef {object} module:@lumjs/core/obj/cp~Typ
 * @prop {module:@lumjs/core/obj/cp~TypTest} test
 * @prop {module:@lumjs/core/obj/cp~TypNew} new
 * @prop {module:@lumjs/core/obj/cp~TypClone} clone **¡**
 * @prop {module:@lumjs/core/obj/cp~TypCpOver} cpOver **¡**
 * @prop {module:@lumjs/core/obj/cp~TypCpSafe} cpSafe **¡**
 * @prop {module:@lumjs/core/obj/cp~TypGetProps} getProps **¡**
 * @prop {module:@lumjs/core/obj/cp~TypCopyAll} copyAll **¿**
 * @prop {module:@lumjs/core/obj/cp~TypCopyOne} copyOne **¿**
 * @prop {module:@lumjs/core/obj/cp~TypExtend} [extend] **‽**
 */

/**
 * Test if a given subject is handled by the definition
 * @callback module:@lumjs/core/obj/cp~TypTest
 * @param {object} subject - Subject to be cloned
 * @returns {boolean} If subject passes the test
 */

/**
 * Function to create a new empty object of a specific type
 * @callback module:@lumjs/core/obj/cp~TypNew
 * @param {module:@lumjs/core/obj/cp~Context} [ctx] - API Context;
 * will be `undefined` if the caller was the simple `cp()` function.
 * @returns {object} New empty object
 */

/**
 * Function to perform a _shallow clone_ for a specific type.
 * 
 * The defalt version calls `this.new()` to get an new empty object,
 * then calls `Object.assign(new, subject)` to populate the clone.
 * Which works fine for basic objects, but may not be suitable for
 * more advanced types.
 * 
 * @callback module:@lumjs/core/obj/cp~TypClone
 * @param {object} subject - Subject to be cloned
 * @param {module:@lumjs/core/obj/cp~Context} [ctx] - API Context;
 * will be `undefined` if the caller was `cp()`.
 * @returns {object} Shallow clone of subject
 */

/**
 * Function to _shallow copy_ enumerable properties into an object;
 * overwrites existing properties.
 * 
 * The default version uses `Object.assign()`, which is great for most
 * objects, but may have unexpected side effects with certain types.
 * 
 * @callback module:@lumjs/core/obj/cp~TypCpOver
 * @param {object} target - Object being copied into
 * @param {Array} sources - Source objects to copy into target
 * @param {module:@lumjs/core/obj/cp~Context} [ctx] - API Context;
 * will be `undefined` if the caller was `cp()`.
 * @returns {object} The `target` after copying has completed
 */

/**
 * Function to _shallow copy_ enumerable properties into an object;
 * only copies non-existent properties.
 * 
 * The default gets a list of properties via `getProps()` from each source,
 * and adds them to the target if they don't exist already.
 *
 * @callback module:@lumjs/core/obj/cp~TypCpSafe
 * @param {object} target - Object being copied into
 * @param {Array} sources - Source objects to copy into target
 * @param {module:@lumjs/core/obj/cp~Context} [ctx] - API Context;
 * will be `undefined` if the caller was `cp.safe()`.
 * @returns {object} The `target` after copying has completed
 */

/**
 * Function to get property descriptors for values in an object.
 * 
 * The default version uses `Object.getOwnPropertyDescriptors()`;
 * if `ctx.opts.all` is `true` it returns the full list,
 * otherwise it returns only the enumerable properties.
 * 
 * @callback module:@lumjs/core/obj/cp~TypGetProps
 * @param {object} subject - Subject to get properties from
 * @param {module:@lumjs/core/obj/cp~Context} [ctx] - API Context;
 * will be `undefined` if the caller was `cp.safe()`.
 * @returns {object} See `Object.getOwnPropertyDescriptors()`,
 * as the return value format must match that function.
 */

/**
 * Optional function to do advanced copying of all sources into a target.
 * [Takes precedence over `copyOne`]
 * @callback module:@lumjs/core/obj/cp~TypCopyAll
 * @param {module:@lumjs/core/obj/cp~Context} ctx - API Context;
 * will have `target` property set.
 * @param {Array} sources - Sources to copy into target.
 * @returns {void}
 */

/**
 * Optional function to do advanced copying of one source into a target.
 * @callback module:@lumjs/core/obj/cp~TypCopyOne
 * @param {module:@lumjs/core/obj/cp~Context} ctx - API Context;
 * will have `target` and `source` properties set.
 * @returns {void}
 */

/**
 * Create a new type handler using an existing one as a template.
 * 
 * @callback module:@lumjs/core/obj/cp~TypExtend
 * @param {...object} defs - Properties to compose into new def.
 * 
 * Any properties passed in these objects will replace the ones
 * from the template type def. We're using `Object.assign()`,
 * so there's no type-checking or overwrite protection. Use with care!
 * 
 * @returns {module:@lumjs/core/obj/cp~Typ} A new type def object.
 */

/**
 * Handler called every time a Context object is updated.
 * 
 * It can examine the update state, and modify options or
 * any other properties in the context object as desired.
 *
 * @callback module:@lumjs/core/obj/cp~OnUpdate
 * @param {object} ctx - API Context which has been updated
 * @param {...object} data - Data passed to update method
 * 
 * On creation of a Context, there will be two arguments,
 * the previous Context if there was one, and the data sent
 * to the constructor.
 * 
 * For calls to update on an existing Context there will generally 
 * only be one data object passed.
 * 
 * @returns {void}
 */

/**
 * Return value from `cpArgs()` function
 * @protected
 * @typedef {object} module:@lumjs/core/obj/cp~CpArgs
 * 
 * @prop {object} subject - The subject argument
 * 
 * Usually contains the _first argument_ passed to the function,
 * unless that argument was a `HandlerSet` in which case
 * the subject will be the _second_ argument (which will also
 * no longer be included in the `sources` array obviously.)
 * 
 * If `sources.length` is `0`, then this will be a shallow clone
 * of the original subject made via `this.th.clone(subject)`
 * 
 * @prop {Array} sources - The source arguments
 * 
 * Everything else specified after the `subject`.
 * May be empty, which will result in the subject being cloned.
 * 
 * @prop {module:@lumjs/core/obj/cp.HandlerSet} handlers
 * 
 * If the first argument was a `HandlerSet` instance, this will
 * contain that object; otherwise it will contain a default set
 * obtained from `cp.TY.self.default` (a special getter).
 * 
 * @prop {true} [invalid] - Is the `subject` invalid?
 * 
 * The subject will be considered invalid if the
 * {@link module:@lumjs/core/types/basics.isComplex isComplex(subject)}
 * test returns `false`.
 * 
 * That is the only case where this property would be set.
 * 
 * @prop {true} [done] Are all operations complete?
 * 
 * If this is `true`, the calling function will return `args.subject` 
 * without any further operations being performed.
 * 
 * Will only ever be set in one of two cases:
 * - `invalid` is `true`
 * - `sources.length` is `0`
 * 
 * @prop {module:@lumjs/core/obj/cp~Typ} [th] - Type handler for `subject`
 * 
 * Will be `undefined` only when `valid` is `false`.
 * 
 */

/**
 * The common code that powers both `cp()` and `cp.safe()`
 * 
 * Parses the arguments sent to those methods, and returns a
 * special object that contains specific properties.
 * 
 * @protected
 * @param {object} subject - See `cp()` docs
 * @param  {...object} sources - See `cp()` docs
 * @returns {module:@lumjs/core/obj/cp~CpArgs}
 * @function
 * @name module:@lumjs/core/obj/cp.__cpArgs
 */
