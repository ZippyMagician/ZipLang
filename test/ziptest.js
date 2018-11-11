const ast = require('../src/lexer.js');
const parse = require('../src/parser.js');
const fs = require('fs');

fs.readFile('test.zp', 'utf8', (err, data) => {
    var code = data;
    parse(ast(code));
})