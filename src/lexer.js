const color = require('./colors')
const keywords = ['if', 'then', 'end', 'print', 'poke', 'def', 'loop', 'close', 'int', 'string', 'bool', 'array'];
const operators = ['==', '!=', '<', '>', '<=', '>='];

function skipSpace(str) {
  let skippable = str.match(/^(\s|#.*#)*/);
  return str.slice(skippable[0].length);
}

function parse_expression(program) {
  if (!program) return;
  program = skipSpace(program);
  let match, expr;
  //console.log("Reading", program);
  if(!program) return;
  if (match = /^"([^"]*)"/.exec(program)) {
    expr = {type: "string", value: match[1]}
  } else if (match = /^[+-:]{0,1}:/.exec(program)) {
    expr = {type: "assign", value: match[0]}
  } else if (match = /^[\d+\b]+|^[-/*]/.exec(program)) {
    expr = {type: "int", value: isNaN(match[0]) ? match[0] : Number(match[0])};
  } else if (match = /^[^\s()#:"]+/.exec(program)) {
    if (keywords.indexOf(match[0]) > -1) expr = {type: "keyword", value: match[0]};
    else if (operators.indexOf(match[0]) > -1) expr = {type: "operator", value: match[0]};
    else if (match[0] === '%') expr = {type: "int", value: match[0]};
    else if (match[0] === 'true' || match[0] === 'false') expr = {type: "bool", value: eval(match[0])};
    else expr = {type: "var", value: match[0]};
  } else if (match = /^[\(\w+\)]+/.exec(program)) {
    expr = {type: "punctuation", value: match[0].split(/([\(\))]|\s)/g).filter(r => r !== '' && r !== ' ')[0]}
  } else { return console.log(color.red, 'Invalid expression ' + program.split(" ")[0]);}
  var char = expr.type === 'string' ? '"' + expr.value + '"' : expr.value.toString();
  return {expr, prog: program, position: char.length};
}

function parse_top(program) {
  var exprs = [];
  var {expr, prog, position} = parse_expression(program) ? parse_expression(program) : {expr: null, prog: null, position: null};
  if (expr === null || prog === null || position === null) return [];

  program = skipSpace(prog.slice(position));
  exprs.push(expr);

  while(program.toString().length >= 1) {
    var parser = parse_expression(program);
    if (!parser) return [];
    if (!program) return [];
    program = skipSpace(program.slice(parser.position));
    exprs.push(parser.expr);
  }

  return exprs;
}

module.exports = parse_top;