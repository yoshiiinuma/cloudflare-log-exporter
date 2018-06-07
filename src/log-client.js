
import zlib from 'zlib';
import request from 'request';
import utils from './utils.js';

const urlPrefix = 'https://api.cloudflare.com/client/v4';

const generateLogApiUrl = (arg) => {
  let stime = utils.toISOStringWithoutMS(arg.startTime);
  let etime = utils.toISOStringWithoutMS(arg.startTime.getTime() + arg.duration);
  let url = urlPrefix + '/zones/' + arg.zoneId + '/logs/received?start=' + stime + '&end=' + etime;
  if (arg.count) url = url + '&count=' + arg.count;
  if (arg.sample) url = url + '&sample=' + arg.sampleRate;
  return url;
}

let logClient = {};

logClient.sample = (arg) => {
  arg.duration = 8 * 60 * 60 * 1000;
}

logClient.get = (arg) => {
  let url = generateLogApiUrl(arg);

  console.log(url);

  return request({
    uri: url,
    json: true,
    gzip: true,
    headers: {
      'X-Auth-Key': arg.authKey,
      'X-Auth-Email': arg.authEmail
    }
  }).on('error', (err) => {
    console.log(err);
  });
};

export default logClient;

