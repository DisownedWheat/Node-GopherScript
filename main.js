"use strict"

var compiler, dev, http, input, port, reqHandler, server;

http = require('http');

compiler = require('./compiler/compiler');

dev = false;

port = 3000;

process.argv.slice(2).forEach(function(val, index, array) {
  if (val === '--dev') {
    return dev = true;
  }
});

if (dev) {
  reqHandler = function(req, res) {
    return res.end('Hello');
  };
  server = http.createServer(reqHandler);
  server.listen(port, function(e) {
    if (e) {
      return console.log(e);
    }
  });
}

console.log("Starting compilation");

console.log("\n\n\n");

input = `
test = () -> print('Hello!')

testOne = (x) -> return x + 1

test = ->
  x = testOne(1)
  print(x)
`;

let c = new compiler.Compiler(input);

c.compile();
