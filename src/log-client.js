
import zlib from 'zlib';
import request from 'request';
import { spawn } from 'child_process';
import MyUtils from './my-utils.js';
import Logger from './logger.js';

let LogClient = {};

const urlPrefix = 'https://api.cloudflare.com/client/v4';
const RETRY_INTERVAL = 10; // 10 Minutes

const AllFields = [
    "CacheCacheStatus", "CacheResponseBytes", "CacheResponseStatus", "CacheTieredFill",
    "ClientASN", "ClientCountry", "ClientDeviceType", "ClientIP", "ClientIPClass",
    "ClientRequestBytes", "ClientRequestHost", "ClientRequestMethod", "ClientRequestProtocol",
    "ClientRequestReferer", "ClientRequestURI", "ClientRequestUserAgent", "ClientSSLCipher",
    "ClientSSLProtocol", "ClientSrcPort", "EdgeColoID", "EdgeEndTimestamp",
    "EdgePathingOp", "EdgePathingSrc", "EdgePathingStatus", "EdgeRateLimitAction", "EdgeRateLimitID",
    "EdgeRequestHost", "EdgeResponseBytes", "EdgeResponseCompressionRatio", "EdgeResponseContentType",
    "EdgeResponseStatus", "EdgeServerIP", "EdgeStartTimestamp",
    "OriginIP", "OriginResponseBytes", "OriginResponseHTTPExpires", "OriginResponseHTTPLastModified",
    "OriginResponseStatus", "OriginResponseTime", "OriginSSLProtocol", "ParentRayID", "RayID",
    "SecurityLevel", "WAFAction", "WAFFlags", "WAFMatchedVar", "WAFProfile", "WAFRuleID", "WAFRuleMessage",
    "WorkerCPUTime", "WorkerStatus", "WorkerSubrequest", "WorkerSubrequestCount", "ZoneID"
];

const fields = [
    "ClientASN", "ClientCountry", "ClientDeviceType", "ClientIP",
    "ClientRequestHost", "ClientRequestMethod", "ClientRequestProtocol",
    "ClientRequestReferer", "ClientRequestURI", "ClientRequestUserAgent",
    "EdgeStartTimestamp", "EdgeEndTimestamp", "EdgeResponseBytes",
    "EdgeResponseContentType", "EdgeResponseStatus", "RayID"];

const generateLogApiUrl = (arg) => {
  let stime = MyUtils.toISOStringWithoutMS(arg.startTime);
  let etime = MyUtils.toISOStringWithoutMS(arg.startTime.getTime() + arg.duration);
  let url = urlPrefix + '/zones/' + arg.zoneId + '/logs/received?start=' + stime + '&end=' + etime;
  if (arg.count) url = url + '&count=' + arg.count;
  if (arg.sample) url = url + '&sample=' + arg.sampleRate;
  url = url + '&fields=' + fields.join(',');
  return url;
}

const createDelayedPullParams = (arg, delayInMin) => {
  let stime = MyUtils.toLocalDateTime(arg.startTime);
  let dur = MyUtils.restoreDuration(arg.duration);
  let env = arg.env;
  let retry = arg.retry + 1;
  return ['dist/pull.js', '-o', '-s', stime, '-r', dur, '-e', env, '--retry', retry, '--delay', delayInMin];
}

const startDelayedPull = (arg, delayInMin) => {
  let command = process.execPath;
  let opt = {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore'
  };
  let params = createDelayedPullParams(arg, delayInMin); 

  Logger.debug('LogClient#startDelayedPull');
  Logger.debug(command);
  Logger.debug(opt);
  Logger.debug(params);

  spawn(command, params, opt).unref();
}

const pull = (arg) => {
  let url = generateLogApiUrl(arg);
  let errHandler = (err) => {
    Logger.error('LogClient#pull ' + url);
    Logger.error(err);
    if (err.code === 'ENOTFOUND') {
      Logger.error('LogClient#pull ENOTFOUND');
    } else if (err.code === 'ENETUNREACH') {
      Logger.error('LogClient#pull ENETUNREACH');
      startDelayedPull(arg, RETRY_INTERVAL);
    } else if (err.code === 'ETIMEDOUT') {
      Logger.error('LogClient#pull ETIMEDOUT');
      startDelayedPull(arg, RETRY_INTERVAL);
    } else {
      Logger.error('#### LOG CLIENT ########################################################');
      Logger.error('ERROR CODE:      ' + err.code);
      Logger.error('ERROR NO:        ' + err.errno);
      Logger.error('ERROR SYSCALL:   ' + err.syscall);
      Logger.error('########################################################################');
    }
  }

  return request({
    uri: url,
    json: true,
    gzip: true,
    headers: {
      'X-Auth-Key': arg.authKey,
      'X-Auth-Email': arg.authEmail
    }
  }).on('error', errHandler);
};

const getFields = (arg) => {
  let url = urlPrefix + '/zones/' + arg.zoneId + '/logs/received/fields';

  return request({
    uri: url,
    json: true,
    gzip: true,
    headers: {
      'X-Auth-Key': arg.authKey,
      'X-Auth-Email': arg.authEmail
    }
  }).on('error', (err) => {
    Logger.error('LogClient#fields ' + url);
    Logger.error(err);
  });
}

LogClient.delayedPull = startDelayedPull;
LogClient.pull = pull;
LogClient.getFields = getFields;

export default LogClient;

