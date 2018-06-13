
import fs from 'fs';
import MyUtils from './my-utils.js';
import ArchiveManager from './archive-manager.js';

function usage() {
  console.log("\n Usage: npm run view -- [OPTIONS]");
  console.log(" Usage: node dist/view.js [OPTIONS]");
  console.log("\n   OPTIONS");
  console.log("     -e or --env:        development|production default development");
  console.log("     --date:             local time YYYY-MM-DD");
  console.log("     --hour:             0-23");
  console.log("     -h or --help:       show this message");
  console.log();
}

var opt = {
  env: 'development',
  date: MyUtils.parseDate('2018-06-06'),
  hour: 10
};

var args = process.argv.slice(2);

while(args.length > 0) {
  let arg = args.shift();
  if (arg === '-h' || arg === '--help') {
    usage();
    process.exit();
  } else if (arg === '-e' || arg === '--env') {
    opt.env = args.shift();
  } else if (arg === '--date') {
    opt.originalDate = args.shift();
    opt.date = MyUtils.parseDate(opt.originalDate);
  } else if (arg === '--hour') {
    opt.originalHour = args.shift();
    opt.hour = parseInt(opt.originalHour);
  } else {
    console.log('Invalid Argument: ' + arg);
    usage();
    process.exit();
  }
}

if (opt.env != 'development' && opt.env != 'production') {
  console.log(" Invalid Environment: " + opt.env);
  usage();
  process.exit();
}

if (!opt.date) {
  console.log(" Invalid Date: " + opt.originalDate);
  usage();
  process.exit();
}

if (!opt.hour || opt.hour < 0 || opt.hour > 23) {
  console.log(" Invalid Hour: " + opt.originalHour);
  usage();
  process.exit();
}

const conf = MyUtils.loadConfig(opt);
if (!conf) {
  console.log('Configuration File Not Found: ' + confFile);
  usage();
  process.exit();
}

let arg = Object.assign(conf, opt);

ArchiveManager.viewHourlyArchive(arg);
