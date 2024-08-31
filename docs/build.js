"use strict";

// Must be run from the project root!

const fs = require('node:fs');
const path = require('node:path');
const marked = require('marked');

const rules = require('./build.rules');
const fsOpts = {encoding: 'utf8'}

for (const dir of rules.dirs)
{ // Doing this synchronously.
  fs.mkdirSync(dir, {recursive: true});
}

for (const file of rules.files)
{
  console.log("←", file.from);
  const toHTML = file.to.endsWith('.html');
  fs.readFile(file.from, fsOpts, (err, data) =>
  {
    if (err) 
    { // Log the error
      console.error(err);
    }
    else
    { // Update and write the file.
      if (toHTML)
      { // Render markdown to HTML
        console.log("«to-html»", file.from);
        data = marked.parse(data);
        data = rules.header + data + rules.footer;
      }

      if (typeof file.update === 'function')
      { // Run custom update script
        console.log("«update»", file.from);
        data = file.update(data);
      }

      fs.writeFile(file.to, data, fsOpts, (err) => 
      {
        if (err)
        {
          console.error(err);
        }
        else
        {
          console.log("→", file.to);
        }
      });
    }
  });
}
