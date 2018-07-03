
import fs from 'fs';
import MyUtils from './my-utils.js';
import PushManager from './push-manager.js';

const WAIT_MINS = 20;

const usage = () => {
  console.log("\n Usage: npm run push -- [OPTIONS]");
  console.log(" Usage: node dist/push.js [OPTIONS]");
  console.log("\n   OPTIONS");
  console.log("     -e or --env:        development|production default development");
  console.log("     -s or --starttime:  local time YYYY-MM-DDThh:mm:ss default " + WAIT_MINS + " minutes before now");
  console.log("     -i or --index:      index to push log data");
  console.log("     -d or --dry:        push to stdout");
  console.log("     -h or --help:       show this message");
  console.log();
};

var opt = {
  env: 'development',
  startTime: MyUtils.getTimeXminAgo(WAIT_MINS),
  duration: 60000,
};

var args = process.argv.slice(2);

var exitProgram = (msg) => {
  if (msg) console.log('PUSH.JS ' + msg);
  usage();
  process.exit();
}

let dryrun = false;

while(args.length > 0) {
  let arg = args.shift();
  if (arg === '-h' || arg === '--help') {
    exitProgram();
  } else if (arg === '-e' || arg === '--env') {
    opt.env = args.shift();
  } else if (arg === '-s' || arg === '--starttime') {
    opt.originalStartTime = args.shift();
    opt.startTime = MyUtils.parseTime(opt.originalStartTime);
  } else if (arg === '-i' || arg === '--index') {
    opt.index = args.shift();
  } else if (arg === '-d' || arg === '--dry') {
    dryrun = true;
  } else {
    exitProgram('Invalid Argument: ' + arg);
  }
}

if (opt.env != 'development' && opt.env != 'production') {
  exitProgram(" Invalid Environment: " + opt.env);
}

if (!opt.startTime) {
  exitProgram(" Invalid Start Time: " + opt.originalStartTime);
}

let conf = MyUtils.initApp(opt);
if (!conf) {
  exitProgram('Configuration File Not Found: ' + MyUtils.config(opt));
}

conf.file = MyUtils.getLogFileName(conf);

if (dryrun) {
  PushManager.read(conf);
} else {
  PushManager.push(conf);
}

