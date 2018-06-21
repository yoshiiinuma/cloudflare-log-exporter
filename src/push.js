
import fs from 'fs';
import MyUtils from './my-utils.js';
import PushManager from './push-manager.js';

const usage = () => {
  console.log("\n Usage: npm run push -- [OPTIONS]");
  console.log(" Usage: node dist/push.js [OPTIONS]");
  console.log("\n   OPTIONS");
  console.log("     -e or --env:        development|production default development");
  console.log("     --date:             local time YYYY-MM-DD");
  console.log("     --hour:             0-23");
  console.log("     -h or --help:       show this message");
  console.log();
};

var opt = {
  env: 'development',
  date: MyUtils.parseDate('2018-06-06'),
  hour: 10
};

var args = process.argv.slice(2);

var exitProgram = (msg) => {
  if (msg) console.log(msg);
  usage();
  process.exit();
}

while(args.length > 0) {
  let arg = args.shift();
  if (arg === '-h' || arg === '--help') {
    exitProgram();
  } else if (arg === '-e' || arg === '--env') {
    opt.env = args.shift();
  } else if (arg === '--date') {
    opt.originalDate = args.shift();
    opt.date = MyUtils.parseDate(opt.originalDate);
  } else if (arg === '--hour') {
    opt.originalHour = args.shift();
    opt.hour = parseInt(opt.originalHour);
  } else {
    exitProgram('Invalid Argument: ' + arg);
  }
}

if (opt.env != 'development' && opt.env != 'production') {
  exitProgram(" Invalid Environment: " + opt.env);
}

if (!opt.date) {
  exitProgram(" Invalid Date: " + opt.originalDate);
}

if (!opt.hour || opt.hour < 0 || opt.hour > 23) {
  exitProgram(" Invalid Hour: " + opt.originalHour);
}

let conf = MyUtils.initApp(opt);
if (!conf) {
  exitProgram('Configuration File Not Found: ' + MyUtils.config(opt));
}

//FIXME use passed arguments
PushManager.push({ index: 'cflogs', file: './output/20180620/log.20180620012002-20180620012102.json' });

