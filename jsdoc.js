"use strict";

const docRules = require('@lumjs/build/jsdoc-rules');
const ourRules = docRules.docsReadme.srcDocs.clone();
module.exports = ourRules;

/*console.debug(
{
  docRules,
  ourRules,
  incPath: ourRules?.source?.include,
});*/

