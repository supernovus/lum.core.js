// Tests of observable API

const {plan,run} = require('./inc/observable');
const t = require('@lumjs/tests').new({module, plan});
run(t);

// All done.
t.done();
