
import fs from 'fs';
import dateFormat from 'dateformat';
import Logger from './logger.js';

let MyUtils = {};

export const DEFAULT_OUTPUT_DIR = './output';
export const DEFAULT_ARCHIVE_DIR = './archive';

const timediff = new Date().getTimezoneOffset() / 60;

/**
 * arg: { env }
 */
MyUtils.initApp = (opt) => {
  let conf = MyUtils.loadConfig(opt);
  if (!conf) return null;
  let arg = Object.assign(conf, opt);

  setUncaughtExceptionHandler();
  Logger.initialize(arg);
  return arg;
}

/**
 * arg: { env }
 */
MyUtils.config = (arg) => {
  return './config/' + arg.env + '.json';
}

/**
 * arg: { env }
 */
MyUtils.loadConfig = (arg) => {
  let confFile = MyUtils.config(arg);
  return MyUtils.jsonToObject(confFile);
}

MyUtils.jsonToObject = (file) => {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file));
}

const setUncaughtExceptionHandler = () => {
  process.on('uncaughtException', (err) => {
    Logger.fatal('########################################################################');
    Logger.fatal('Uncaught Exception');
    Logger.fatal(err);
    Logger.fatal('########################################################################');
  });
  process.on('unhandledRejection', (reason, p) => {
    Logger.fatal('########################################################################');
    Logger.fatal('Unhandled Rejection');
    Logger.fatal(reason);
    Logger.fatal(p);
    Logger.fatal('########################################################################');
  });
}

/**
 * Recursively creates directories
 */
MyUtils.mkdir = (fpath) => {
  fpath.split('/').reduce((curPath, folder) => {
    curPath += folder + '/';
    if (!fs.existsSync(curPath)) {
      fs.mkdirSync(curPath);
    }
    return curPath;
  }, '');
}

/**
 * Recursively deletes directories
 */
MyUtils.rmdir = (dir) => {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((file, index) => {
      let curPath = dir + '/' + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        MyUtils.rmdir(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dir);
  }
}

const regexDur = /^([1-9]|[1-5]\d|60|)(s|sec|secs|m|min|mins)$/i;

MyUtils.convDuration = (str) => {
  if (!regexDur.test(str)) return null;

  let match = regexDur.exec(str);
  if (match[2].startsWith('m')) {
    return parseInt(match[1]) * 60 * 1000;
  } else {
    return parseInt(match[1]) * 1000;
  }
}

const regexSampleRate = /^(1|0\.\d+)$/;

MyUtils.parseSampleRate = (str) => {
  if (!regexSampleRate.test(str)) return null;
  return Number(str);
}

const regexDate = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Expects HST and ouputs UTC
 */
MyUtils.parseDate = (str, hh = 0, mm = 0, ss = 0) => {
  if (!regexDate.test(str)) return null;
  let ms = Date.parse(str);
  if (!ms) return null;
  hh = parseInt(hh);
  mm = parseInt(mm);
  ss = parseInt(ss);
  ms = ms + ((hh + timediff) * 3600 + mm * 60 + ss) * 1000
  return new Date(ms);
}

/**
 * YYYY-MM-DDThh:mm:ss  => HST
 * YYYY-MM-DDThh:mm:ssZ => UTC
 */
MyUtils.parseTime = (str) => {
  let ms = Date.parse(str);
  if (!ms) return null;
  return new Date(ms);
}

MyUtils.getYesterday = (hh = 0, mm = 0, ss = 0) => {
  return MyUtils.getXDaysAgo(1, hh, mm, ss);
}

MyUtils.getTwoDaysAgo = (hh = 0, mm = 0, ss = 0) => {
  return MyUtils.getXDaysAgo(2, hh, mm, ss);
}

MyUtils.getXDaysAgo = (x = 1, hh = 0, mm = 0, ss = 0) => {
  let date = new Date(new Date() - x * 86400 * 1000);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm, ss);
}

/**
 * Ouputs UTC
 * Note: time should be in UTC if type of time is 'number'
 */
MyUtils.addTime = (time, millisecs) => {
  if (typeof time === 'number') {
    return new Date(time + millisecs);
  } else {
    return new Date(time.getTime() + millisecs);
  }
}

/**
 * Returns time x minutes before now, truncating seconds and milliseconds
 *
 */
MyUtils.getTimeXminAgo = (min) => {
  let date = new Date();
  date.setMilliseconds(0);
  date.setSeconds(0);
  date.setMinutes(date.getMinutes() - min);
  return date;
}

MyUtils.toLocalDate = (time) => {
  return dateFormat(time, 'yyyy-mm-dd');
}

MyUtils.toLocalDateTime = (time) => {
  return dateFormat(time, 'yyyy-mm-dd HH:MM');
}

MyUtils.toLocalTime = (arg) => {
  if (arg.hour || arg.hour == 0) {
    return MyUtils.toLocalDate(arg.date) + 'T' + arg.hour.toString().padStart(2, '0') + ':00';
  } else {
    return MyUtils.toLocalDate(arg.date);
  }
}

MyUtils.toLocalDateString = (time) => {
  if (typeof time === 'number') time = new Date(time);
  return time.toLocalDateString();
}

MyUtils.toLocalTimeString = (time) => {
  if (typeof time === 'number') time = new Date(time);
  return time.toLocalDateString() + 'T' + time.toLocalTimeString().replace(/:\d{2}$/, '');
}

MyUtils.toISOStringWithoutMS = (time) => {
  if (typeof time === 'number') time = new Date(time);
  return time.toISOString().replace(/\.\d{3}Z/, 'Z');
}

MyUtils.flattenTime = (time) => {
  if (typeof time === 'number') time = new Date(time);
  return time.toISOString().replace(/\.\d{3}Z/, '').replace(/[:\-T]/g,'');
}

MyUtils.flattenDate = (time) => {
  return MyUtils.flattenTime(time).slice(0, 8);
}

MyUtils.flattenDateHour = (time) => {
  return MyUtils.flattenTime(time).slice(0, 10);
}

MyUtils.adjustTimediff = (date, hour) => {
  return date.getTime() + (hour - timediff) * 3600 * 1000;
}

MyUtils.getLogFilePattern = (date, hour, prefix = 'log.') => {
  let datehour = MyUtils.flattenDateHour(MyUtils.adjustTimediff(date, hour));
  console.log('DATE: ' + date.toISOString() + '; HOUR: ' + hour);
  console.log(' -->  ' + datehour);
  return new RegExp(prefix + datehour); 
}

MyUtils.getLogFileDir = (date, outdir = DEFAULT_OUTPUT_DIR) => {
  let dir = outdir;
  if (!dir.endsWith('/')) dir += '/';
  if (typeof date === 'string') {
    dir += date;
  } else {
    dir += MyUtils.flattenDate(date);
  }
  return dir;
}

/**
 * arg: { startTime, duration, outputDir }
 */
MyUtils.getLogFileName = (arg, prefix = 'log.') => {
  let stime = MyUtils.flattenTime(arg.startTime);
  let etime = MyUtils.flattenTime(arg.startTime.getTime() + arg.duration);
  let dir = MyUtils.getLogFileDir(arg.startTime, arg.outputDir) + '/';
  MyUtils.mkdir(dir);
  return dir + prefix + stime + '-' + etime + '.json';
}

MyUtils.getArchiveDir = (date, archiveDir = DEFAULT_ARCHIVE_DIR) => {
  let dir = archiveDir;
  if (!dir.endsWith('/')) dir += '/';
  if (typeof date === 'string') {
    dir += date;
  } else {
    dir += MyUtils.flattenDate(date);
  }
  return dir;
}

/**
 * arg: { date, hour, archiveDir }
 */
MyUtils.getArchiveFileName = (arg) => {
  //let date = MyUtils.addTime(arg.date, arg.hour * 3600 * 1000);
  let date = MyUtils.adjustTimediff(arg.date, arg.hour);
  let dir = MyUtils.getArchiveDir(date, arg.archiveDir);
  MyUtils.mkdir(dir);
  return dir + '/' + MyUtils.flattenDateHour(date) + '.json.gz';
}

export default MyUtils;
