
import fs from 'fs';
import dateFormat from 'dateformat';

let utils = {};

export const DEFAULT_OUTPUT_DIR = './output';
export const DEFAULT_ARCHIVE_DIR = './archive';

utils.mkdir = (path) => {
  path.split('/').reduce((curPath, folder) => {
    curPath += folder + '/';
    if (!fs.existsSync(curPath)) {
      fs.mkdirSync(curPath);
    }
    return curPath;
  }, '');
}

utils.getYesterday = (hh = 0, mm = 0, ss = 0) => {
  let date = new Date(new Date() - 86400 * 1000);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm, ss);
}

/**
 * Ouputs UTC
 * Note: time should be in UTC if type of time is 'number'
 */
utils.addTime = (time, millisecs) => {
  if (typeof time === 'number') {
    return new Date(time + millisecs);
  } else {
    return new Date(time.getTime() + millisecs);
  }
}

const regexDur = /^([1-9]|[1-5]\d|60|)(s|sec|secs|m|min|mins)$/i;

utils.convDuration = (str) => {
  if (!regexDur.test(str)) return null;

  let match = regexDur.exec(str);
  if (match[2].startsWith('m')) {
    return parseInt(match[1]) * 60 * 1000;
  } else {
    return parseInt(match[1]) * 1000;
  }
}

utils.jsonToObject = (path) => {
  if (!fs.existsSync(path)) return null;
  return JSON.parse(fs.readFileSync(path));
}

const regexSampleRate = /^(1|0\.\d+)$/;

utils.parseSampleRate = (str) => {
  if (!regexSampleRate.test(str)) return null;
  return Number(str);
}

const regexDate = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Expects HST and ouputs UTC
 * FIXME: Only works with HST; time diff should be dynamically assigned
 */
utils.parseDate = (str, hh = 0, mm = 0, ss = 0) => {
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
utils.parseTime = (str) => {
  let ms = Date.parse(str);
  if (!ms) return null;
  return new Date(ms);
}

utils.dropMillisecs = (timeInMs) => {
  return Math.floor(timeInMs / 1000) * 1000;
}

utils.getTimeXminAgoInMS = (min) => {
  return utils.dropMillisecs(new Date() - min * 60 * 1000);
}

utils.getTimeXminAgo = (min) => {
  return new Date(utils.getTimeXminAgoInMS(min));
}

utils.toLocalDate = (time) => {
  return dateFormat(time, 'yyyy-mm-dd');
}

utils.toLocalDateTime = (time) => {
  return dateFormat(time, 'yyyy-mm-dd HH:MM');
}

utils.toLocalTime = (arg) => {
  if (arg.hour || arg.hour == 0) {
    return utils.toLocalDate(arg.date) + 'T' + arg.hour.toString().padStart(2, '0') + ':00';
  } else {
    return utils.toLocalDate(arg.date);
  }
}

utils.toLocalDateString = (time) => {
  if (typeof time === 'number') time = new Date(time);
  return time.toLocalDateString();
}

utils.toLocalTimeString = (time) => {
  if (typeof time === 'number') time = new Date(time);
  return time.toLocalDateString() + 'T' + time.toLocalTimeString().replace(/:\d{2}$/, '');
}

utils.toISOStringWithoutMS = (time) => {
  if (typeof time === 'number') time = new Date(time);
  return time.toISOString().replace(/\.\d{3}Z/, 'Z');
}

utils.flattenTime = (time) => {
  if (typeof time === 'number') time = new Date(time);
  return time.toISOString().replace(/\.\d{3}Z/, '').replace(/[:\-T]/g,'');
}

utils.flattenDate = (time) => {
  return utils.flattenTime(time).slice(0, 8);
}

utils.flattenDateHour = (time) => {
  return utils.flattenTime(time).slice(0, 10);
}

utils.getLogFilePattern = (date, hour, prefix = 'log.') => {
  let datehour = utils.flattenDateHour(date.getTime() + hour * 3600 * 1000);
  return new RegExp(prefix + datehour); 
}

utils.getLogFileDir = (date, outdir = DEFAULT_OUTPUT_DIR) => {
  let path = outdir;
  if (!path.endsWith('/')) path += '/';
  if (typeof date === 'string') {
    path += date;
  } else {
    path += utils.flattenDate(date);
  }
  return path;
}

/**
 * arg: { startTime, duration, outputDir }
 */
utils.getLogFileName = (arg, prefix = 'log.') => {
  let stime = utils.flattenTime(arg.startTime);
  let etime = utils.flattenTime(arg.startTime.getTime() + arg.duration);
  let path = utils.getLogFileDir(arg.startTime, arg.outputDir) + '/';
  utils.mkdir(path);
  return path + prefix + stime + '-' + etime + '.json';
}

utils.getArchiveDir = (date, archiveDir = DEFAULT_ARCHIVE_DIR) => {
  let path = archiveDir;
  if (!path.endsWith('/')) path += '/';
  if (typeof date === 'string') {
    path += date;
  } else {
    path += utils.flattenDate(date);
  }
  return path;
}

/**
 * arg: { date, hour, archiveDir }
 */
utils.getArchiveFileName = (arg) => {
  let date = utils.addTime(arg.date, arg.hour * 3600 * 1000);
  let path = utils.getArchiveDir(date, arg.archiveDir);
  utils.mkdir(path);
  return path + '/' + utils.flattenDateHour(date) + '.json.gz';
}

export default utils;
