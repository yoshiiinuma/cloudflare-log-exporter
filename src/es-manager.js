
import fs from 'fs';
import MyUtils from './my-utils.js';
import Logger from './logger.js';
import EsClient from './es-client.js';

const usage = () => {
  console.log("\n Usage: npm run es-manager <COMMAND> -- [OPTIONS]");
  console.log(" Usage: node dist/es-manager.js <COMMAND> [OPTIONS]");
  console.log();
  console.log("   COMMAND:");
  console.log("     health:                          Shows health status");
  console.log("     show-indices:                    Lists all indices");
  console.log("     show-index <INDEX>:              Shows the index");
  console.log("     create-index <INDEX>:            Creates the index");
  console.log("     delete-index <INDEX>:            Deletes the index");
  console.log("     create-mapping <INDEX>:          Uploads mapping definition for the index");
  console.log("     show-mapping <INDEX>:            Shows mapping definition for the index");
  console.log("     rotate-index <INDEX>:            Rotates the index");
  console.log();
  console.log("   OPTIONS");
  console.log("     -e or --env:        {development|production}; default development");
  console.log("     -h or --help:       show this message");
  console.log();
};

var opt = {
  env: 'development'
};

var args = process.argv.slice(2);

var exitProgram = (msg) => {
  if (msg) console.log(msg);
  usage();
  process.exit();
}

let command = null;
let params = [];

while(args.length > 0) {
  let arg = args.shift();
  if (arg === '-h' || arg === '--help') {
    exitProgram();
  } else if (arg === '-e' || arg === '--env') {
    opt.env = args.shift();
  } else if (arg === 'health' || arg === 'show-indices') {
    command = arg;
  } else if (arg === 'create-index' || arg === 'show-index' || arg === 'delete-index'  ||
      arg === 'rotate-index' || arg === 'create-mapping' || arg === 'show-mapping') {
    command = arg;
    opt.index = args.shift();
    params.push(opt.index);
  } else {
    exitProgram('Invalid Argument: ' + arg);
  }
}

if (opt.env != 'development' && opt.env != 'production') {
  exitProgram(" Invalid Environment: " + opt.env);
}

let conf = MyUtils.initApp(opt);
if (!conf) {
  exitProgram('Configuration File Not Found: ' + MyUtils.config(opt));
}

if (command === 'health') {
  EsClient.getHealth(conf)
} else if (command === 'show-indices') {
  EsClient.getIndices(conf)
} else if (command === 'show-index') {
  EsClient.getIndex(conf)
} else if (command === 'create-index') {
  EsClient.putIndex(conf)
} else if (command === 'delete-index') {
  EsClient.deleteIndex(conf)
} else if (command === 'create-mapping') {
  EsClient.putMapping(conf)
} else if (command === 'show-mapping') {
  EsClient.getMapping(conf)
} else if (command === 'rotate-index') {
  exitProgram('Not Supported Yet: ' + command)
} else {
  exitProgram('Invalid Command: ' + command + ' ' + params.join(' '))
}

