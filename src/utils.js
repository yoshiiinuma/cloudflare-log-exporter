
import fs from 'fs';

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

utils.addTime = (time, millisecs) => {
  if (typeof time === 'number') {
    return new Date(time + millisecs);
  } else {
    return new Date(time.getTime() + millisecs);
  }
}

const regexSampleRate = /^(1|0\.\d+)$/;

utils.parseSampleRate = (str) => {
  if (!regexSampleRate.test(str)) return null;
  return Number(str);
}

const regexDate = /^\d{4}-\d{2}-\d{2}$/;

utils.parseDate = (str, hh = 0, mm = 0, ss = 0) => {
  if (!regexDate.test(str)) return null;
  let ms = Date.parse(str);
  if (!ms) return null;
  ms = ms + ((hh + 10) * 3600 + mm * 60 + ss) * 1000
  return new Date(ms);
}

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

utils.toISOStringWithoutMS = (time) => {
  if (typeof time === 'number') time = new Date(time);
  return time.toISOString().replace(/\.\d{3}Z/, 'Z');
}

utils.flattenTime = (time) => {
  if (typeof time === 'number') time = new Date(time);
  return time.toISOString().replace(/\.\d{3}Z/, '').replace(/[:\-T]/g,'');
}

utils.flattenDate = (time) => {
  return utils.flattenTime(time).substring(0, 8);
}

utils.getDefaultLogFileName = (arg, prefix = 'log') => {
  let stime = utils.flattenTime(arg.startTime);
  let etime = utils.flattenTime(arg.startTime.getTime() + arg.duration);
  let path = arg.outputDir || DEFAULT_OUTPUT_DIR;
  if (!path.endsWith('/')) path += '/';
  path += utils.flattenDate(arg.startTime) + '/';
  utils.mkdir(path);
  return path + prefix + '.' + stime + '-' + etime + '.json';
}

utils.getYesterday = (hh = 0, mm = 0, ss = 0) => {
  let date = new Date(new Date() - 86400 * 1000);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hh, mm, ss);
}

export default utils;
