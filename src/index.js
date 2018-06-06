
import fs from 'fs';
import utils from './utils.js';
import logClient from './log-client.js';

function usage() {
  console.log("\n Usage: npm run exec -- [OPTIONS]");
  console.log(" Usage: node dist/index.js [OPTIONS]");
  console.log("\n   OPTIONS");
  console.log("     -e or --env:        development|production default development");
  console.log("     -s or --starttime:  local time YYYY-MM-DDThh:mm:ss default 10 minutes before now");
  console.log("     -r or --duration:   [1-60]{s|sec|secs|m|min|mins} default 1m");
  console.log("     -c or --count:      max number of log data to retrieve");
  console.log("     -o or --output:     output goes to a specified file or default file instead stdout");
  console.log("     -h or --help:       show this message");
  console.log();
}

var opt = {
  env: 'development',
  startTime: utils.getTimeXminAgo(10),
  duration: 60000,
  //output: process.stdout,
  toFile: false
};

var args = process.argv.slice(2);

while(args.length > 0) {
  let arg = args.shift();
  if (arg === '-h' || arg === '--help') {
    usage();
    process.exit();
  } else if (arg === '-e' || arg === '--env') {
    opt.env = args.shift();
  } else if (arg === '-s' || arg === '--starttime') {
    opt.originalStartTime = args.shift();
    opt.startTime = utils.parseTime(opt.originalStartTime);
  } else if (arg === '-r' || arg === '--duration') {
    let dur = args.shift();
    opt.originalDuration = dur;
    opt.duration = utils.convDuration(dur);
  } else if (arg === '-c' || arg === '--count') {
    opt.count = args.shift();
  } else if (arg === '-o' || arg === '--output') {
    opt.toFile = true;
    if (args[0] && !args[0].startsWith('-')) {
      opt.outfile = args.shift();
    }
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

if (!opt.startTime) {
  console.log(" Invalid Start Time: " + opt.originalStartTime);
  usage();
  process.exit();
}

if (!opt.duration) {
  console.log(" Invalid Duration: " + opt.originalDuration);
  usage();
  process.exit();
}

let regexInt = /^\d+$/;

if (opt.count) {
  if (!regexInt.test(opt.count)) {
    console.log(" Invalid Count: " + opt.count);
    usage();
    process.exit();
  }
  opt.count = parseInt(opt.count);
}

let confFile = './config/' + opt.env + '.json';
const conf = utils.jsonToObject(confFile);
if (!conf) {
  console.log('Configuration File Not Found: ' + confFile);
  usage();
  process.exit();
}

const showConf = (conf) => { 
  console.log(' ZONE ID:     ' + conf.zone_id);
  console.log(' AUTH EMAIL:  ' + conf.auth_email);
  console.log(' AUTH KEY:    ' + conf.auth_key);
}

const showOpt = (opt) => {
  console.log(' ENV:         ' + opt.env);
  console.log(' Start:       ' + utils.toISOStringWithoutMS(opt.startTime));
  console.log(' Duration:    ' + opt.duration);
  console.log(' Count:       ' + opt.count);
}

//showConf(conf);
//showOpt(opt);

let arg = Object.assign(conf, opt);

//console.log(arg);

if (arg.toFile) {
  if (!arg.outfile) arg.outfile = utils.getDefaultLogFileName(arg);
  arg.output = fs.createWriteStream(arg.outfile);
} else {
  arg.output = process.stdout;
}


logClient.get(Object.assign(conf, opt))
  .pipe(arg.output);
  //.pipe(process.stdout);

  //.then((res) => console.log(res))
  //.catch((err) => console.log(err))



