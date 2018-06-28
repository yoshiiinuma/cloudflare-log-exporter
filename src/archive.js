
import fs from 'fs';
import MyUtils from './my-utils.js';
import Logger from './logger.js';
import ArchiveManager from './archive-manager.js';

const usage = () => {
  console.log("\n Usage: npm run archive -- [OPTIONS]");
  console.log(" Usage: node dist/archive.js [OPTIONS]");
  console.log("\n   OPTIONS");
  console.log("     -e or --env:        development|production default development");
  console.log("     --date:             local time YYYY-MM-DD; default two days ago");
  console.log("     --hour:             0-23");
  console.log("     --delete:           deletes source log files after archiving");
  console.log("     -h or --help:       show this message");
  console.log();
};

let opt = {
  env: 'development',
  date: MyUtils.getTwoDaysAgo()
};

let args = process.argv.slice(2);

let exitProgram = (msg) => {
  if (msg) console.log(msg);
  usage();
  process.exit();
}

let needDelete = false;

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
  } else if (arg === '--delete') {
    needDelete = true;
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

if (opt.hour) {
  if (opt.hour < 0 || opt.hour > 23) {
    exitProgram(" Invalid Hour: " + opt.originalHour);
  }
}

let conf = MyUtils.initApp(opt);
if (!conf) {
  exitProgram('Configuration File Not Found: ' + MyUtils.config(opt));
}

const deleteDir = (arg) => {
  let dir = MyUtils.getLogFileDir(arg.date, arg.outputDir);

  if (!dir || !fs.existsSync(dir)) {
    Logger.error("ARCHIVE.JS Directory Not Found: " + dir);
  }
  MyUtils.rmdir(dir);
  Logger.info('DELETED ' + dir);
}

if (conf.hour) {
  ArchiveManager.createHourlyArchive(conf)
    .then((msg) => Logger.info(msg))
    .catch((err) => {
      Logger.error('ARCHIVE.JS HOURLY ARCHIVE');
      Logger.error(err)
    });
} else {
  ArchiveManager.createDailyArchive(conf)
    .then((results) => {
      results.map((msg) => Logger.info(msg));
      return;
    })
    .then(() => {
      if (needDelete) {
        deleteDir(conf);
      }
    })
    .catch((err) => {
      Logger.error('ARCHIVE.JS DAILY ARCHIVE');
      Logger.error(err)
    });
}

