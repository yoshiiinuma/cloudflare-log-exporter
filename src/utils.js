
import fs from 'fs';

let utils = {};

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

export default utils;
