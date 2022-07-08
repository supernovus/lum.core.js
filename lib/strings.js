// String methods.
const {S,B,F,isObj,root,isArray,needType,needObj} = require('./types')

/**
 * Get the locale/language string.
 * 
 * 1. If `navigator.language` exists it will be used.
 * 2. If `Intl` exists it will be used.
 * 3. If neither of those exist, uses `'en-US'` as a default.
 * 
 * @returns string - The locale/language string.
 */
function getLocale()
{
  if (isObj(root.navigator) && typeof root.navigator.language === S)
  {
    return root.navigator.language;
  }
  else if (isObj(root.Intl))
  {
    try 
    {
      const lang = root.Intl.DateTimeFormat().resolvedOptions().locale;
      return lang;
    }
    catch (err)
    {
      console.warn("Attempt to get locale from Intl failed", err);
    }
  }

  // A last-ditch fallback.
  return 'en-US';
}

exports.getLocale = getLocale;

/**
 * Make the first character of a string uppercase.
 * 
 * @param {string} string - The input string.
 * @param {boolean} [lcrest=false] Make the rest of the string lowercase? 
 * @param {string} [locale=getLocale()] The locale/language of the string.
 * 
 * @returns string - The output string.
 */
function ucfirst ([ first, ...rest ], lcrest = false, locale = getLocale())
{
  first = first.toLocaleUpperCase(locale);
  rest  = rest.join('');
  if (lcrest)
  {
    rest = rest.toLocaleLowerCase(locale);
  }
  return first + rest;
}

exports.ucfirst = ucfirst;

/**
 * Make the first character of each *word* in a string uppercase.
 *  
 * @param {string} string - The input string. 
 * @param {boolean} [unicode=false] Use Unicode words? (Only uses ASCII words otherwise)
 * @param {boolean} [lcrest=false] Make the rest of each word lowercase? 
 * @param {string} [locale=getLocale()] The locale/language of the string. 
 * 
 * @returns {string} - The output string.
 */
function ucwords(string, unicode = false, lcrest = false, locale = getLocale())
{
  const regex = unicode ? /[0-9\p{L}]+/ug : /\w+/g;
  return string.replace(regex, word => ucfirst(word, lcrest, locale));
}

exports.ucwords = ucwords;

/**
 * Is the passed in value a valid `String.replace` search value.
 */
function isSearch(value)
{
  return (typeof value === S || value instanceof RegExp);
}

exports.isSearch = isSearch;

/**
 * Is the passed in value a valid `String.replace` replacement value.
 */
function isReplacement(value)
{
  return (typeof value === S || typeof value === F);
}

exports.isReplacement = isReplacement;

function replaceItems(string, replacements, useAll)
{
  needType(S, string);
  needObj(replacements);

  // This will call the appropriate method.
  function replace()
  {
    if (useAll)
      string = string.replaceAll(...arguments);
    else
      string = string.replace(...arguments);
  }

  if (isArray(replacements))
  { // An array of arrays of replace/replaceAll parameters.
    useAll = useAll ?? false; // Defaults to false here if it wasn't set.
    for (const replacement of replacements)
    {
      if (isArray(replacement) && replacement.length == 2
        && isSearch(replacement[0]) && isReplacement(replacement[1]))
      { // A set of parameters for the function.
        replace(...replacement);
      }
      else if (typeof replacement === B)
      { // A boolean will override the current useAll value.
        useAll = replacement;
      }
      else 
      { // That's not valid.
        console.error("Invalid replacement value", replacement);
      }
    }
  }
  else 
  { // Any other object is a map of find strings to replacement values.
    useAll = useAll ?? true; // Defaults to true here if it wasn't set.
    for (const find in replacements)
    {
      const value = replacements[find];
      if (isReplacement(value))
      { 
        replace(find, value);
      }
      else 
      { 
        console.error("Invalid replacement value", value);
      }
    }
  }

  return string;
}

exports.replaceItems = replaceItems;

