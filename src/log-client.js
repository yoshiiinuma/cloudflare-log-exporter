
import zlib from 'zlib';
import request from 'request';
import MyUtils from './my-utils.js';
import Logger from './logger.js';

const urlPrefix = 'https://api.cloudflare.com/client/v4';

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
    "EdgeEndTimestamp", "EdgeRequestHost", "EdgeResponseBytes",
    "EdgeResponseContentType", "EdgeResponseStatus", "EdgeStartTimestamp",
    "RayID"];

const generateLogApiUrl = (arg) => {
  let stime = MyUtils.toISOStringWithoutMS(arg.startTime);
  let etime = MyUtils.toISOStringWithoutMS(arg.startTime.getTime() + arg.duration);
  let url = urlPrefix + '/zones/' + arg.zoneId + '/logs/received?start=' + stime + '&end=' + etime;
  if (arg.count) url = url + '&count=' + arg.count;
  if (arg.sample) url = url + '&sample=' + arg.sampleRate;
  url = url + '&fields=' + fields.join(',');
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

logClient.fields = (arg) => {
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
    Logger.error(err);
  });
}

export default logClient;

