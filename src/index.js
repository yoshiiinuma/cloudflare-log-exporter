
import fs from 'fs';
import utils from './utils.js';
import Log from './logging.js';
import logClient from './log-client.js';

const DEFAULT_SAMPLE_RATE = 0.01;
const WAIT_MINS = 15;

function usage() {
  console.log("\n Usage: npm run exec -- [OPTIONS]");
  console.log(" Usage: node dist/index.js [OPTIONS]");
  console.log("\n   OPTIONS");
  console.log("     -e or --env:        development|production default development");
  console.log("     -s or --starttime:  local time YYYY-MM-DDThh:mm:ss default " + WAIT_MINS + " minutes before now");
  console.log("     -r or --duration:   [1-60]{s|sec|secs|m|min|mins} default 1m");
  console.log("     -c or --count:      max number of log data to retrieve");
  console.log("     -o or --output:     option <FILENAME>; output goes to a specified file or default file instead stdout");
  console.log("     --sample:           sampling rate eg. 0.01 default 0.01");
  console.log("     -h or --help:       show this message");
  console.log();
}

var opt = {
  env: 'development',
  startTime: utils.getTimeXminAgo(WAIT_MINS),
  duration: 60000,
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
  } else if (arg === '--sample') {
    opt.sample = true;
    if (args[0] && !args[0].startsWith('-')) {
      opt.origSampleRate = args.shift();
      opt.sampleRate = utils.parseSampleRate(opt.origSampleRate);
    } else {
      opt.sampleRate = DEFAULT_SAMPLE_RATE;
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

if (opt.sample) {
  if (!opt.sampleRate) {
    console.log(" Invalid Sample Rate: " + opt.origSampleRate);
    usage();
    process.exit();
  }
}

let confFile = './config/' + opt.env + '.json';
const conf = utils.jsonToObject(confFile);
if (!conf) {
  console.log('Configuration File Not Found: ' + confFile);
  usage();
  process.exit();
}

let arg = Object.assign(conf, opt);

if (arg.toFile) {
  if (!arg.outfile) arg.outfile = utils.getLogFileName(arg);
  arg.output = fs.createWriteStream(arg.outfile);
} else {
  arg.output = process.stdout;
}

Log.initialize(arg);

logClient.get(arg)
  .pipe(arg.output);

