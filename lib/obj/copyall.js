/**
 * This is a 'dumb' copy method.
 *
 * It does no type checking, and has no qualms about overwriting properties.
 * You probably want something like `copyProps` instead.
 * 
 * @alias module:@lumjs/core/obj.copyAll
 */
function copyAll(target, ...sources)
{
  for (const source of sources)
  {
    for (const name in source)
    {
      target[name] = source[name];
    }
  }
  return target;
}

module.exports = copyAll;
