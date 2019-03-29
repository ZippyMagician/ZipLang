const lexer = require('./src/lexer');
const parser = require('./src/parser');

module.exports = {
  tokenstream: (code) => lexer(code),
  execute: (tokens) => parser(tokens)
}
