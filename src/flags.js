
const {N} = require('./types');

/**
 * Add or remove a binary flag from a set of flags.
 * @param {number} flags - An integer representing a set of flags.
 * @param {number} flag - An integer representing the flag to add or remove.
 * @param {boolean} [value=true] `true` means add, `false` means remove. 
 * @returns {number} The `flags` with the `flag` added or removed accordingly.
 */
function setFlag(flags, flag, value=true)
{
  if (typeof flags !== N) throw new TypeError("Flags must be number");
  if (typeof flag !== N) throw new TypeError("Flag must be number");

  if (value)
    flags = flags | flag;
  else
   flags = flags - (flags & flag);

  return flags;
}

exports.setFlag = setFlag;

/**
 * Combine an entire set of flags into a single set.
 * @param {...number} flag - Any number of flags you want to add.
 * @returns {number} All the passed flags combined into one set.
 */
function allFlags()
{
  const flags = 0;
  for (const arg of arguments)
  {
    if (typeof arg !== N)
    {
      throw new TypeError("Arguments must be numbers");
    }
    flags = flags | arg;
  }
  return flags;
}

exports.allFlags = allFlags
