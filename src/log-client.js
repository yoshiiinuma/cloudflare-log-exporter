
import zlib from 'zlib';
import request from 'request';
import utils from './utils.js';

const urlPrefix = 'https://api.cloudflare.com/client/v4';

const generateLogApiUrl = (arg) => {
  let stime = utils.toISOStringWithoutMS(arg.startTime);
  let etime = utils.toISOStringWithoutMS(arg.startTime.getTime() + arg.duration);
  let url = urlPrefix + '/zones/' + arg.zone_id + '/logs/received?start=' + stime + '&end=' + etime;
  if (arg.count) url = url + '&count=' + arg.count;
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
      'X-Auth-Key': arg.auth_key,
      'X-Auth-Email': arg.auth_email
    }
  }).on('error', (err) => {
    console.log(err);
  });
};

export default logClient;

