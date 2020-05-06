
import fs from 'fs';
import MyUtils from './my-utils.js';
import Logger from './logger.js';
import EsClient from './es-client.js';

const usage = () => {
  console.log("\n Usage: npm run es <COMMAND> -- [OPTIONS]");
  console.log(" Usage: node dist/es.js <COMMAND> [OPTIONS]");
  console.log();
  console.log("   COMMAND:");
  console.log("     health:                          Shows health status");
  console.log("     show-indices:                    Lists all indices");
  console.log("     show-index <INDEX>:              Shows the index");
  console.log("     create-index <INDEX>:            Creates the index");
  console.log("     delete-index <INDEX>:            Deletes the index");
  console.log("     delete-oldest-index:             Deletes the oldest index");
  console.log("     show-templates:                  Shows template definitions");
  console.log("     show-template <INDEX>:           Shows template definition for the index");
  console.log("     create-template <INDEX>:         Creates a template for the index");
  console.log("     delete-template <INDEX>:         Deletes a template for the index");
  console.log("     show-mappings:                   Shows mappings definition");
  console.log("     show-mapping <INDEX>:            Shows mapping definition for the index");
  console.log("     create-mapping <INDEX>:          Uploads mapping definition for the index");
  console.log("     rollover-index <INDEX>:          Rolls an index alias over to a new index");
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
  if (msg) console.log('ES.JS ' + msg);
  usage();
  process.exit();
}

const INDEX_COMMANDS = [
  'show-indices', 'show-index', 'create-index', 'delete-index',
  'create-mapping', 'show-mapping', 'create-template',
  'rollover-index'];

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
  } else if (arg === 'delete-oldest-index') {
    command = arg;
  } else if (arg === 'show-mappings') {
    command = arg;
  } else if (arg === 'show-templates') {
    command = arg;
  } else if (arg === 'create-index' || arg === 'show-index' || arg === 'delete-index'  ||
      arg === 'rollover-index' || arg === 'show-mapping' || arg === 'show-template') {
    command = arg;
    opt.index = args.shift();
    params.push(opt.index);
  } else if (arg === 'create-mapping' || arg === 'create-template' || arg === 'delete-template') {
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
  EsClient.getHealth(conf).then((r) => console.log(r));
} else if (command === 'show-indices') {
  EsClient.getIndices(conf).then((r) => console.log(r));
} else if (command === 'show-index') {
  if (!conf.index) exitProgram('No Index Provided');
  EsClient.getIndex(conf).then((r) => console.log(r));
} else if (command === 'create-index') {
  if (!conf.index) exitProgram('No Index Provided');
  EsClient.putIndex(conf).then((r) => console.log(r));
} else if (command === 'delete-index') {
  if (!conf.index) exitProgram('No Index Provided');
  EsClient.deleteIndex(conf).then((r) => console.log(r));
} else if (command === 'delete-oldest-index') {
  EsClient.deleteOldestIndex(conf).then((r) => console.log(r));
} else if (command === 'show-templates') {
  EsClient.getTemplates(conf).then((r) => console.log(r));
} else if (command === 'show-template') {
  if (!conf.index) exitProgram('No Index Provided');
  EsClient.getTemplate(conf).then((r) => console.log(r));
} else if (command === 'create-template') {
  if (!conf.index) exitProgram('No Index Provided');
  EsClient.putTemplate(conf).then((r) => console.log(r));
} else if (command === 'delete-template') {
  if (!conf.index) exitProgram('No Index Provided');
  EsClient.deleteTemplate(conf).then((r) => console.log(r));
} else if (command === 'create-mapping') {
  if (!conf.index) exitProgram('No Index Provided');
  EsClient.putMapping(conf).then((r) => console.log(r));
} else if (command === 'show-mappings') {
  EsClient.getMappings(conf).then((r) => console.log(r));
} else if (command === 'show-mapping') {
  if (!conf.index) exitProgram('No Index Provided');
  EsClient.getMapping(conf).then((r) => console.log(r));
} else if (command === 'rollover-index') {
  if (!conf.index) exitProgram('No Index Provided');
  EsClient.rollover(conf).then((r) => console.log(r));
} else {
  exitProgram('Invalid Command: ' + command + ' ' + params.join(' '));
}

