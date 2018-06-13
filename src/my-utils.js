
import fs from 'fs';
import dateFormat from 'dateformat';

let MyUtils = {};

export const DEFAULT_OUTPUT_DIR = './output';
export const DEFAULT_ARCHIVE_DIR = './archive';

MyUtils.mkdir = (path) => {
  path.split('/').reduce((curPath, folder) => {
    curPath += folder + '/';
    if (!fs.existsSync(curPath)) {
      fs.mkdirSync(curPath);
    }
    return curPath;
  }, '');
}

MyUtils.getYesterday = (hh = 0, mm = 0, ss = 0) => {
  let date = new Date(new Date() - 86400 * 1000);
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

MyUtils.jsonToObject = (path) => {
  if (!fs.existsSync(path)) return null;
  return JSON.parse(fs.readFileSync(path));
}

const regexSampleRate = /^(1|0\.\d+)$/;

MyUtils.parseSampleRate = (str) => {
  if (!regexSampleRate.test(str)) return null;
  return Number(str);
}

const regexDate = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Expects HST and ouputs UTC
 * FIXME: Only works with HST; time diff should be dynamically assigned
 */
MyUtils.parseDate = (str, hh = 0, mm = 0, ss = 0) => {
  let timediff = 10;
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

MyUtils.dropMillisecs = (timeInMs) => {
  return Math.floor(timeInMs / 1000) * 1000;
}

MyUtils.getTimeXminAgoInMS = (min) => {
  return MyUtils.dropMillisecs(new Date() - min * 60 * 1000);
}

MyUtils.getTimeXminAgo = (min) => {
  return new Date(MyUtils.getTimeXminAgoInMS(min));
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

MyUtils.getLogFilePattern = (date, hour, prefix = 'log.') => {
  let datehour = MyUtils.flattenDateHour(date.getTime() + hour * 3600 * 1000);
  return new RegExp(prefix + datehour); 
}

MyUtils.getLogFileDir = (date, outdir = DEFAULT_OUTPUT_DIR) => {
  let path = outdir;
  if (!path.endsWith('/')) path += '/';
  if (typeof date === 'string') {
    path += date;
  } else {
    path += MyUtils.flattenDate(date);
  }
  return path;
}

/**
 * arg: { startTime, duration, outputDir }
 */
MyUtils.getLogFileName = (arg, prefix = 'log.') => {
  let stime = MyUtils.flattenTime(arg.startTime);
  let etime = MyUtils.flattenTime(arg.startTime.getTime() + arg.duration);
  let path = MyUtils.getLogFileDir(arg.startTime, arg.outputDir) + '/';
  MyUtils.mkdir(path);
  return path + prefix + stime + '-' + etime + '.json';
}

MyUtils.getArchiveDir = (date, archiveDir = DEFAULT_ARCHIVE_DIR) => {
  let path = archiveDir;
  if (!path.endsWith('/')) path += '/';
  if (typeof date === 'string') {
    path += date;
  } else {
    path += MyUtils.flattenDate(date);
  }
  return path;
}

/**
 * arg: { date, hour, archiveDir }
 */
MyUtils.getArchiveFileName = (arg) => {
  let date = MyUtils.addTime(arg.date, arg.hour * 3600 * 1000);
  let path = MyUtils.getArchiveDir(date, arg.archiveDir);
  MyUtils.mkdir(path);
  return path + '/' + MyUtils.flattenDateHour(date) + '.json.gz';
}

export default MyUtils;
