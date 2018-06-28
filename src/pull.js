
import fs from 'fs';
import MyUtils from './my-utils.js';
import logClient from './log-client.js';
import Logger from './logger.js';

const DEFAULT_SAMPLE_RATE = 0.01;
const WAIT_MINS = 15;

var usage = () => {
  console.log("\n Usage: npm run pull -- [OPTIONS]");
  console.log(" Usage: node dist/pull.js [OPTIONS]");
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
  startTime: MyUtils.getTimeXminAgo(WAIT_MINS),
  duration: 60000,
  toFile: false
};

var args = process.argv.slice(2);

var exitProgram = (msg) => {
  if (msg) console.log('PULL.JS ' + msg);
  usage();
  process.exit();
}

while(args.length > 0) {
  let arg = args.shift();
  if (arg === '-h' || arg === '--help') {
    exitProgram();
  } else if (arg === '-e' || arg === '--env') {
    opt.env = args.shift();
  } else if (arg === '-s' || arg === '--starttime') {
    opt.originalStartTime = args.shift();
    opt.startTime = MyUtils.parseTime(opt.originalStartTime);
  } else if (arg === '-r' || arg === '--duration') {
    let dur = args.shift();
    opt.originalDuration = dur;
    opt.duration = MyUtils.convDuration(dur);
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
      opt.sampleRate = MyUtils.parseSampleRate(opt.origSampleRate);
    } else {
      opt.sampleRate = DEFAULT_SAMPLE_RATE;
    }
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

if (!opt.duration) {
  exitProgram(" Invalid Duration: " + opt.originalDuration);
}

let regexInt = /^\d+$/;

if (opt.count) {
  if (!regexInt.test(opt.count)) {
    exitProgram(" Invalid Count: " + opt.count);
  }
  opt.count = parseInt(opt.count);
}

if (opt.sample) {
  if (!opt.sampleRate) {
    exitProgram(" Invalid Sample Rate: " + opt.origSampleRate);
  }
}

let conf = MyUtils.initApp(opt);
if (!conf) {
  exitProgram('Configuration File Not Found: ' + MyUtils.config(opt));
}

let output = process.stdout;

if (conf.toFile) {
  if (!conf.outfile) conf.outfile = MyUtils.getLogFileName(conf);
  output = fs.createWriteStream(conf.outfile);
  output.on('error', (err) => {
    Logger.error('PULL.JS WRITESTREAM');
    Logger.error(err);
  });
  output.on('close', () => {
    Logger.info('PULL.JS DONE ' + conf.outfile);
  });
}

logClient.get(conf).pipe(output);

