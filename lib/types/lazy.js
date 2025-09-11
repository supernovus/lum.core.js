const {deprecated} = require('../meta');
const {lazy} = require('../obj/df');

/**
 * Build a lazy initializer property.
 * @name module:@lumjs/core/types.lazy
 * @deprecated Moved to `obj` module; this alias will be removed in v2.x
 * @see {@link module:@lumjs/core/obj.lazy} for API docs.
 */
module.exports = function (...args)
{
  const retval = lazy(...args);
  return deprecated(
    'core.types.def.lazy',
    'core.obj.lazy',
    retval
  );
}
