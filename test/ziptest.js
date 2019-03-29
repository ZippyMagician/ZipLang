const ziplang = require('../');
const fs = require('fs');

console.log("Beginning build");

fs.readFile('test/test.zp', 'utf8', (err, data) => {
    var code = data;
    ziplang.execute(ziplang.tokenstream(code));
})
