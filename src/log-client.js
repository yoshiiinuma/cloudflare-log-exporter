
import zlib from 'zlib';
import request from 'request';
import MyUtils from './my-utils.js';
import Log from './logger.js';

const urlPrefix = 'https://api.cloudflare.com/client/v4';

const generateLogApiUrl = (arg) => {
  let stime = MyUtils.toISOStringWithoutMS(arg.startTime);
  let etime = MyUtils.toISOStringWithoutMS(arg.startTime.getTime() + arg.duration);
  let url = urlPrefix + '/zones/' + arg.zoneId + '/logs/received?start=' + stime + '&end=' + etime;
  if (arg.count) url = url + '&count=' + arg.count;
  if (arg.sample) url = url + '&sample=' + arg.sampleRate;
  return url;
}

let logClient = {};

logClient.get = (arg) => {
  let url = generateLogApiUrl(arg);

  return request({
    uri: url,
    json: true,
    gzip: true,
    headers: {
      'X-Auth-Key': arg.authKey,
      'X-Auth-Email': arg.authEmail
    }
  }).on('error', (err) => {
    Logger.error(err);
  });
};

export default logClient;

