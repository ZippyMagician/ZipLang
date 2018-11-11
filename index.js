#!/usr/bin/env node
const lexer = require('./src/lexer');
const parser = require('./src/parser');
const rl = require('readline-sync');
const color = require('./src/colors.js');
const cli = require('./src/cli');
const cmd = require('node-cmd');
const clear = require('clear');
const fs = require('fs');

const argv = require('minimist')(process.argv.slice(2));

  rl.setPrompt('');

  //console.log(color.cyan, 'Enter the name of a file in examples/, or enter nothing to activate user input. Files end in .zp');
  cli.ReadArgs(argv, (name, data) => {
    if (name === "-f") return runFile(data);
    else if (name === "-u") {
      clear();
      console.log(color.yellow, `ZipLang by ZippyMagician [${require('./package.json').version}]\n`);
      console.log(color.cyan, "Enter \"close\" to exit");
      return userInput(data === true ? null : data);
    } else if (name === "update") {
      console.log("Updating");
      cmd.get(
        'npm update -g ziplang',
        function (err, data, stderr) {
          if (!err) {
            console.log(color.yellow, "Ziplang update successful, updated to version " + require('./package.json').version);
          } else {
            console.log(color.red, err);
          }
        }
      );
    }
  })

  function userInput(input=null) {
    if (input) {
      console.log(color.green, '=> ' + parser(lexer(input)));
      userInput();
    } else {
      rl.setPrompt('>');
      input = rl.prompt();
      console.log(color.green, '=> ' + parser(lexer(input)));
      userInput();
    }
    //console.log(lexer(input));
  }

  function runFile(name) {
    console.log("Reading", name)
    fs.readFile(name, 'utf8', (err, data) => {
      let code = data;
      console.log(color.green, '=> ' + parser(lexer(code)));
      //console.log(JSON.stringify(lexer(code.join(" "))));
    });
  }