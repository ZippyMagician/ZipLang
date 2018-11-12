const color = require('./colors.js');
const Environment = require('./environment.js');
const rl = require('readline-sync');
const operators = ['==', '!=', '<', '>', '<=', '>='];
const math = ['+', '-', '/', '*', '%'];
const math_values = {
  '+': 4, '-': 4,
  '*': 5, '/': 5, '%': 5
}
const relex = require('./lexer.js');

function execute(tokens, env) {
  var pos = 0;
  const next = () => {pos++; return tokens[pos]};
  const look = () => {return tokens[pos]};
  const peek = () => {return tokens[parseInt(pos) + 1]};
  const last = () => {return tokens[parseInt(pos) - 1]};
  const back = () => {pos--; return tokens[pos]};
  const croak = (message) => {console.log(color.red, message); for(var i = 0; i <= tokens.length + 5; i++) next();}
      
      function parse_contents(name) {
        let ret = [], end_count = 0;
        while(look().value !== name || (look().value === name && end_count > 0)) {
          if(look().value === name || look().value === "end") end_count--;
          ret.push(next());

          if (!look()) return croak('Cannot parse container, expected ' + name);
          if (look().value === "if" || look().value === "loop" || look().value === "def") end_count++;
          if (!look()) return croak(`Missing ${name} statement`);
        }
        let popped = ret.pop();

        return ret;
      }

      function parse_var_call(token) {
        var name = token.value ? token.value : token;

        next();
        var vars = parse_contents(")")
        if(vars) vars = vars.filter(r => r.value !== ",");
        
        let func = env.get(name);

        vars.forEach(r => {if(r.type === "keyword") return croak("Invalid ending to container");});

        if(!vars) return;
        if(!func.value) return croak(name + " does not exist");
        if(!func.value.type) return croak(name + " does not exist");
        
        if(func.value.type === "array") {
          let num = vars[0];
          if(num.type === "var") {
            num = relex(env.get(num.value).value.toString())[0]
          }
          
          if(num.type !== "int") return croak(num.type + "s are not ints");
          next();
          if(!func.value.contents[parseInt(num.value)]) return croak("Array " + name + " does not have a length of " + parseInt(parseInt(num.value) + 1));
          return func.value.contents[parseInt(num.value)].value;
        } else if(func.value.type === "function") {
          for(var tok in func.value.args) {
            let t = func.value.args[tok];
            let r = vars[tok];
            if(!r) return croak("Invalid amount of parameters");

            if (r.type === "var" && (r.value === "true," || r.value === "false,")) {r.type = "bool"; r.value = eval(r.value.substr(0, r.value.length - 1))}
            else if (r.type === "var" && r.value.endsWith(",")) r.value = r.value.substr(0, r.value.length - 1);

            if (!r.type || (!r.value && r.value !== false)) return croak("Invalid amount of parameters");

            if (r.type === "var") r = env.get(r.value);
            if(!r.type && r.value) r = relex(r.value.toString())[0];

            if (t.type !== r.type) return croak("Variable " + t.value + " requires a " + t.type);

            var newenv = env;
            newenv.set(t.value, r.value);
          }
        
          execute(func.value.contents, newenv);
        }

        return next();
      }

      function boolify(token) {
        return token.value === true ? true : token.value === false ? false : croak("Attempted to convert a non bool into a bool");
      }
      
      function parse_var_contents() {
        let ret = [], end = false;

        if (!peek()) return croak("Invalid syntax for variable definition");

        if (peek().type === "keyword" && peek().value !== "poke") return croak("You cannot set a variable to a keyword");
        ret.push(next());
        if ((ret[0].type === "int" || ret[0].type === "var") && peek()) {
          if (peek().type === "int" && math.indexOf(peek().value) > -1) {
            while(look().type === "int" || (look().type === "var" && (peek().type === "int" || (last().type === "int" && math.indexOf(last().value) > -1)))) {
              ret.push(next());
              if (!look()) return ret.filter(r => r);
            }
            return ret.filter(r => r);
          } else return ret.filter(r => r);
        }

        return ret.filter(r => r);
      }

      function check_var(inp) {
        if(!inp) return croak("Invalid termination of math statement");
        if (inp.type === "var") return parseInt(env.get(inp.value).value);
        else return parseInt(inp.value);
      }

      function parse_math(mathlist) {
        var level = 5, result = [];
        for (var i = 1; i <= 2; i++) {
          for(var expr = 0; expr < mathlist.length; expr++) {
            if (math_values[mathlist[expr].value] === level) {
              switch(mathlist[expr].value) {
                case '*':
                  result.push(check_var(mathlist[parseInt(expr) - 1]) * check_var(mathlist[parseInt(expr) + 1]));
                break;
                case '/':
                  result.push(check_var(mathlist[parseInt(expr) - 1]) / check_var(mathlist[parseInt(expr) + 1]));
                break;
                case '%':
                  result.push(check_var(mathlist[parseInt(expr) - 1]) % check_var(mathlist[parseInt(expr) + 1]));
                break;
                case '+':
                  result.push(check_var(mathlist[parseInt(expr) - 1]) + check_var(mathlist[parseInt(expr) + 1]));
                break;
                case '-':
                  result.push(check_var(mathlist[parseInt(expr) - 1]) - check_var(mathlist[parseInt(expr) + 1]));
                break;
              }
              mathlist[expr] = {type: "int", value: result[0]};
              mathlist.splice(parseInt(expr) - 1, 1);
              mathlist.splice(parseInt(expr), 1);
              result = [];
              expr--;
            }
          }
          level--;
        }
        result = mathlist;

        return result[0];
      }

      function parse_boolean(f, l, op) {
        switch(op) {
          case '==':
            return f == l;
          break;
          case '!=':
            return f != l;
          break;
          case '>':
            return f > l;
          break;
          case '<':
            return f < l;
          break;
          case '>=':
            return f >= l;
          break;
          case '<=':
            return f <= l;
          break;
          default:
            return croak('Cannot parse operation', op);
        }
      }

      function parse_operation(tokenlist) {
        var expr = {left: [], right: [], type: 'operator', value: ''};
        var opfound = 0;
        for(var token in tokenlist) {
          if (tokenlist[token].type === "operator") {
            expr.value = tokenlist[token].value;
            opfound = 2;
          } else {
            if (tokenlist[token].type === "int" && math.indexOf(tokenlist[token].value) > -1) {
              if (opfound === 0) expr.left.push({type: "operator", value: tokenlist[token].value});
              else expr.right.push({type: "operator", value: tokenlist[token].value});
            } else {
              if (opfound === 0) expr.left.push(tokenlist[token]);
              else if (opfound === 2) expr.right.push(tokenlist[token]);
            }
          }
        }
        //console.log(JSON.stringify(expr));
        expr.left = expr.left.length > 1 ? parse_math(expr.left) : expr.left[0];
        expr.right = expr.right.length > 1 ? parse_math(expr.right) : expr.right[0];

        return expr;
      }

      function parse_var(token) {
        switch(token.value) {
          case '::':
            var name = last();
            var contents = parse_var_contents();
            if(!contents) return;

            if (contents.length > 1) {
              var contents = [parse_math(contents)];
            }

            if (!name.type) return croak('Invalid variable name');
            if (name.type !== 'var') return croak('Must have a string (without quotations) for the name of a variable');
            
            if (contents[0].type === "var" && contents.length === 1) contents = env.get(contents[0].value).value;
            else if (contents[0].type === "keyword") contents = parse_keyword(contents[0]).trim();
            else if (contents.length === 1 && contents[0].value) contents = contents[0].value;

            if (contents === true || contents === false) contents = [{type: "bool", value: contents}];

            if (!isNaN(contents)) contents = parseInt(contents);
            if(!contents) return croak("Undefined variable");
            
            env.setconst(name.value, typeof contents === "object" ? contents[0].value : contents);
          break;
          case ':':
            var name = last();
            var contents = parse_var_contents();
            
            if(!contents) return;
            
            if (contents.length > 1) {
              var contents = [parse_math(contents)];
            }

            if (!name.type) return croak('Invalid variable name');
            if (name.type !== 'var') return croak('Must have a string (without quotations) for the name of a variable');
            
            if (contents[0].type === "var" && contents.length === 1) contents = env.get(contents[0].value).value;
            else if (contents[0].type === "keyword") contents = parse_keyword(contents[0]).trim();
            else if (contents.length === 1 && contents[0].value) contents = contents[0].value;
            
            if(!contents) return croak("Undefined variable");

            if (contents === true || contents === false) contents = [{type: "bool", value: contents}];
            if (!isNaN(contents)) contents = parseInt(contents);

            env.set(name.value, typeof contents === "object" ? contents[0].value : contents);
          break;
          case '+:':
            var name = last();
            var contents = parse_var_contents();
            if(!contents) return;
            
            if (contents.length > 1) {
              var contents = parse_math(contents);
            }

            if (!name.type) return croak('Invalid variable name');
            if (name.type !== 'var') return croak('Must have a string (without quotations) for the name of a variable');
            
            if (contents[0].type === "var" && contents.length === 1) contents = env.get(contents[0].value).value;
            else if (contents[0].type === "keyword") contents = parse_keyword(contents[0]);
            else if (contents.length === 1 && contents[0].value) contents = contents[0].value;
            contents = typeof contents === "object" ? contents[0].value : contents;
            var setter = env.get(name.value).value
            if(setter) if(!isNaN(setter)) setter = parseInt(setter);
            contents = isNaN(contents) ? contents : parseInt(contents);

            //console.log(setter, contents);
            env.set(name.value, setter + contents);
          break;
          case '-:':
            var name = last();
            var contents = parse_var_contents();
            if(!contents) return;
            
            if (contents.length > 1) {
              var contents = parse_math(contents);
            }

            if (!name.type) return croak('Invalid variable name');
            if (name.type !== 'var') return croak('Must have a string (without quotations) for the name of a variable');

            if (contents[0].type === "var" && contents.length === 1) contents = env.get(contents[0].value).value;
            else if (contents[0].type === "keyword") contents = parse_keyword(contents[0]);
            else if (contents.length === 1 && contents[0].value) contents = contents[0].value;
            contents = typeof contents === "object" ? contents[0].value : contents;
            var setter = /^[\d+\b]+|^[-/*]/.test(env.get(name.value).value) ? env.get(name.value).value : parseInt(env.get(name));
            contents = /^[\d+\b]+|^[-/*]/.test(contents) ? contents : parseInt(contents);
            env.set(name.value, setter - contents);
          break;
        }
      }

      function parse_keyword(token) {
        switch(token.value) {
          case 'print':
            next();
            if(!look()) return croak("You cannot print nothing");
            if (look().type !== 'var' && look().type !== 'int') { console.log(look().value);
            } else if (look().type === 'var') {
              //console.log(env)
              if(!env.get(look().value)) return croak('Undefined variable ' + look().value + ' in print statement');
              let value = env.get(look().value);
              if(!value.value) return croak("Undefined variable " + look().value)
              if (peek()) {
                if (peek().type === "int" && math.indexOf(peek().value) > -1) {
                  back();
                  var content = parse_math(parse_var_contents());
                  console.log(content);
                } else if (peek().type === "punctuation") {
                  console.log(parse_var_call(look().value));
                } else console.log(value.value);
              } else {
                console.log(value.value);
              }
            } else if (look().type === 'int') {
              if (!peek()) return console.log(look().value);
              if (math.indexOf(peek().value) > -1) {
                back();
                let value = parse_math(parse_var_contents().filter(r => r));
                console.log(value.value);
              } else console.log(look().value);
            }
            next();
          break;
          case 'loop':
            if(!peek()) return croak("Invalid syntax for loop statement");
            if (peek().type !== 'int' && peek().type !== 'var' && peek().type !== 'keyword') return croak(`Missing int or variable after loop statement. Instead got a ${peek().type} with the value ${peek().value}`);

            var num = next();
            if(num.type === 'keyword' && num.value !== 'poke') return croak(`Missing int or variable after loop statement. Instead got a ${peek().type} with the value ${peek().value}`);
            var contents = parse_contents('end');
            if(!contents) return null;

            if (num.type === 'int') {
              for(var i = 0; i < parseInt(num.value); i++) {
                execute(contents, env);
              }
            } else if (num.type === 'var') {
              num = env.get(num.value).value;
              for(var i = 0; i < parseInt(num); i++) {
                execute(contents, env);
              }
            } else if (num.type === 'keyword') {
              num = parse_keyword(num);
              for(var i = 0; i < parseInt(num); i++) {
                execute(contents, env);
              }
            }
            next();
          break;
          case 'end':
            next();
            return croak('Invalid use of end');
          break;
          case 'then':
            next();
            return croak('Invalid use of then');
          case 'poke':
            next();
            rl.setPrompt('>>');
            return rl.prompt();
          case 'if':
            next();
            if(!look()) return croak('Invalid termination of if statement');

            let first;
            if (look().type === 'var') first = env.get(look().value).value;
            if (!first && first !== false) first = look().value;
            if(!peek()) return croak('Invalid termination of if statement');
            if (peek().type === 'keyword') {
              if (peek().value !== 'then') return croak('Missing then keyword after if operator');
              next();
              let contents = parse_contents('end');

              let test = contents;
              var els = undefined;
              
              if(!test || !contents) return;

              test = test.map(r => r.type === "string" ? '"' + r.value + '"' : r.value).join(" ").split("else");
              if (test.length > 1) {
                contents = relex(test[0]);
                els = relex(test[1]);
              }
              
              if(first) execute(contents, env);
              else if (els) execute(els, env);
            } else {
              back();
              let operation = parse_contents('then');
              operation = parse_operation(operation);
              if (!operation.left || !operation.right) return croak('Invalid expression in if statement');
              first = operation.left.type === "var" ? env.get(operation.left.value).value : operation.left.value;
              let lst = operation.right.type === "var" ? env.get(operation.right.value).value : operation.right.value;
              let contents = parse_contents('end');
              
              let test = contents;
              var els = undefined;
              
              if(!test || !contents) return;

              test = test.map(r => r.type === "string" ? '"' + r.value + '"' : r.value).join(" ").split("else");
              if (test.length > 1) {
                contents = relex(test[0]);
                els = relex(test[1]);
              }

              if(parse_boolean(first, lst, operation.value)) execute(contents, env);
              else if (els) execute(els, env);
            }
            next();
          break;
          case 'close':
            process.exit();
          break;
          case 'def':
            if(!peek()) return croak("Invalid syntax");
            if(peek().type !== "var") return croak("Cannot use a " + peek().type + " as the name of a function");

            var name = peek().value;
            next();
            if(!peek()) return croak("Invalid syntax");
            if(peek().type !== "punctuation") return croak("Invalid syntax");

            next();
            var params = parse_contents(")");
            if(!peek()) return croak("Missing end statement");
            var contents = parse_contents("end");

            var newp = params.map(r => r.value).join(" ").split(",").map(x => x.trim()).filter(r => r !== '');

            for (var tok in newp) {
              if (newp[tok].split(" ").length > 2) return croak("Missing comma");
              if (newp[tok].split(" ").length < 2) return croak("Invalid syntax");
            }

            var retp = [];
            for(var tok in newp) {
              let obj = {type: "", value: ""};
              let tester = newp[tok].split(" ");
              obj.type = tester[1];
              obj.value = tester[0];

              retp.push(obj);
            }

            next();

            env.setconst(name, {type: "function", value: name, args: retp, contents: contents});
          break;
          case 'array':
            if(!peek()) return croak("Invalid syntax");
            if(peek().type !== "var") return croak("Cannot use a string/int/bool as the name of an array");

            var name = peek().value;
            next();

            if(!peek()) return croak("Invalid syntax");
            if(peek().type !== "punctuation") return croak("Missing parentheses");
            next();

            var params = parse_contents(")");
            if(params.length < 1) return croak("Missing values in array");
            var newparams = [];

            newparams = params.map(r => r.type === "string" ? '"' + r.value + '"' : r.value).join(" ").split(",").map(r => r.trim()).map(r => relex(r));
            
            newparams.forEach(r => {
              if(r.length > 1) r = parse_math(r);
              else r = r[0].type !== "var" ? r[0].value : env.get(r[0].value).value;
            });

            newparams = newparams.map(r => r[0]);

            env.setconst(name, {type: "array", value: name, contents: newparams});

            next();
          break;
          default:
            return croak('Unable to parse expression ' + JSON.stringify(token));
        }
      }

  if(!tokens) return false;

  for(var i = 0; i < tokens.length; i++) {
    if(look()) {
      var current = look();
      switch (current.type) {
        case 'keyword':
          parse_keyword(current);
        break;
        case 'string':
        case 'int':
        case 'bool':
          next();
        break;
        case 'var':
          if(peek()) {
            if(peek().type === "punctuation") {
              parse_var_call(current);
            } else next();
          } else next();
        break;
        case 'assign':
          parse_var(current);
        break;
        default:
          croak('An error occured while parsing the ' + current.type + ' "' + current.value + '"');
          return false;
      }
    } else return true;
  }
}

module.exports = tokens => execute(tokens, new Environment());