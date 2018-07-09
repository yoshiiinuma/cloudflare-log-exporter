
import fs from 'fs';
import MyUtils from './my-utils.js';
import Logger from './logger.js';
import ArchiveManager from './archive-manager.js';

const usage = () => {
  console.log("\n Usage: npm run delete <TARGET> <DAYS-AGO> -- [OPTIONS]");
  console.log(" Usage: node dist/delete.js <TARGET> <DAYS-AGO> [OPTIONS]");
  console.log();
  console.log("   TARGET:             {logs|archives}; specifies a directory to delete");
  console.log("   DAYS-AGO:           the number of days ago, which specifies date to delete");
  console.log("\n   OPTIONS");
  console.log("     -e or --env:        {development|production}; default development");
  console.log("     -h or --help:       show this message");
  console.log();
};

const ARCHIVE = 'archives';
const CFLOG = 'logs';

var opt = {
  env: 'development'
};

var args = process.argv.slice(2);

var exitProgram = (msg) => {
  if (msg) console.log('DELETE.JS ' + msg);
  usage();
  process.exit();
}

opt.target = args.shift();
opt.origDaysAgo = args.shift();

if (!opt.target) {
  exitProgram('Target Not Specified');
} else {
  if (opt.target !== CFLOG && opt.target !== ARCHIVE) {
    exitProgram('Invalid Target ' + opt.target);
  }
}

if (!opt.origDaysAgo) {
  exitProgram('DAYS-AGO Not Specified');
} else {
  if (!/^\d+$/.test(opt.origDaysAgo)) {
    exitProgram('Invalid DAYS-AGO ' + opt.origDaysAgo);
  }
  opt.daysAgo = parseInt(opt.origDaysAgo);
  if (!opt.daysAgo || opt.daysAgo < 0) {
    exitProgram('Invalid DAYS-AGO ' + opt.origDaysAgo);
  }
}

while(args.length > 0) {
  let arg = args.shift();
  if (arg === '-h' || arg === '--help') {
    exitProgram();
  } else if (arg === '-e' || arg === '--env') {
    opt.env = args.shift();
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

let target = opt.target;
let date = MyUtils.getXDaysAgo(opt.daysAgo);

if (!date) {
  exitProgram(" Invalid DAYS-AGO: " + opt.origDaysAgo);
}

let dir = null;

if (target === ARCHIVE) {
  dir = MyUtils.getArchiveDir(date, conf.archiveDir);
} else {
  dir = MyUtils.getLogFileDir(date, conf.outputDir);
}

if (!dir || !fs.existsSync(dir)) {
  exitProgram(" Directory Not Found: " + dir);
}

if (MyUtils.rmdir(dir)) {
  Logger.info('DELETE.JS DELETED ' + dir);
} else {
  Logger.error('DELETE.JS NOT FOUND: ' + dir);
}

