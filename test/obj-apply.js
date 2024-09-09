const plan = 5;
const t = require('@lumjs/tests').new({module,plan});
const apply = require('../lib/obj/apply');

let o1 = {};
const c1 = {hello: 'world'};
const c2 = {hello: 'W0rlD'};
const c3 = {goodbye: 'Universe'};

apply(o1, c1);
t.isJSON(o1, c1, 'applied changes to empty object');
apply(o1, c2);
t.isJSON(o1, c1, 'does not overwrite by default');
apply(o1, c3);
t.is(o1.goodbye, c3.goodbye, 'applied new props');
apply(o1, function() {
  this.olleh = this.hello.split('').reverse().join('');
});
t.is(o1.olleh, 'dlrow', 'function call using `this`');
apply(o1, (_,opts) => opts.cp.set({overwrite: true}));
//apply(o1, console.log);
apply(o1, c2);
t.is(o1.hello, c2.hello, 'overwrite enabled via function')

t.done();
