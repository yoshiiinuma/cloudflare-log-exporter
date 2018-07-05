
import fs from 'fs';
import request from 'request-promise';
import util from 'util';
import MyUtils from './my-utils.js';
import Logger from './logger.js';

const DEFAULT_ENDPOINT = 'http://localhost:9200/';
const DEFAULT_INDEX_MAX_AGE = '30d';

let EsClient = {};

const tempType = '_doc';
const pretty = '?pretty';
const v = '?v';

const endpoint = (arg) => {
  return arg.esApiEndpoint || DEFAULT_ENDPOINT;
};

const postProcess = (r) => {
  Logger.debug('EsClient#postProcess')
  Logger.debug(util.inspect(r, false, null));
  return r;
};

const getErrorHandler = (method, url) => {
  return (err) => {
    Logger.error('EsClient#' + method + ' ' + url);
    Logger.error(err);
    return r;
  }
};

const esGet = (name, url, data, cbOk = null, cbErr = null) => {
  if (!cbOk) cbOk = postProcess
  if (!cbErr) cbErr = getErrorHandler(name, url);
  return request({ url, json: true, })
    .then(cbOk)
    .catch(cbErr);
}

const esPost = (name, url, data, cbOk = null, cbErr = null) => {
  if (!cbOk) cbOk = postProcess
  if (!cbErr) cbErr = getErrorHandler(name, url);
  let method = 'POST';
  return request({ url, method, json: true, body: data })
    .then(cbOk)
    .catch(cbErr);
}

const esPut = (name, url, data, cbOk = null, cbErr = null) => {
  if (!cbOk) cbOk = postProcess
  if (!cbErr) cbErr = getErrorHandler(name, url);
  let method = 'PUT';
  return request({ url, method, json: true, body: data })
    .then(cbOk)
    .catch(cbErr);
}

const esDel = (name, url, cbOk = null, cbErr = null) => {
  if (!cbOk) cbOk = postProcess
  if (!cbErr) cbErr = getErrorHandler(name, url);
  let method = 'DELETE';
  return request({ url, method, json: true })
    .then(cbOk)
    .catch(cbErr);
}

EsClient.getHealth = (arg) => {
  let url = endpoint(arg) + '_cat/health' + v;
  return esGet('getHealth', url);
};

EsClient.getNodes = (arg) => {
  let url = endpoint(arg) + '_cat/nodes' + v;
  return esGet('getNodes', url);
};

EsClient.getIndices = (arg) => {
  let url = endpoint(arg) + '_cat/indices' + v;
  return esGet('getIndices', url);
};

EsClient.getIndex = (arg) => {
  let url = endpoint(arg) + arg.index + pretty;
  return esGet('getIndex', url);
};

const getSrcData = (fpath) => {
  if (!fpath) {
    Logger.error('EsClient#getSrcData File Not Specified: ' + fpath);
    return null;
  } else if (!fs.existsSync(fpath)) {
    Logger.error('EsClient#getSrcData File Not Found: ' + fpath);
    return null;
  }
  return MyUtils.jsonToObject(fpath);
};

EsClient.putIndex = (arg) => {
  let url = endpoint(arg) + arg.index + pretty;
  let data = getSrcData(arg.esIndexSrc);
  if (!data) {
    Logger.error('EsClient#getSrcData Failed');
    return Promise.resolve();
  }
  return esPut('putIndex', url, data);
}

EsClient.deleteIndex = (arg) => {
  let url = endpoint(arg) + arg.index + pretty;
  return esDel('deleteIndex', url);
}

EsClient.getMapping = (arg) => {
  let url = endpoint(arg) + arg.index + '/_mapping/' + tempType + pretty;
  return esGet('getMapping', url);
}

EsClient.putMapping = (arg) => {
  let url = endpoint(arg) + arg.index + '/_mapping/' + tempType;
  let data = getSrcData(arg.esIndexMappingSrc);
  if (!data) {
    Logger.error('EsClient#getSrcData Failed');
    return Promise.resolve();
  }
  return esPut('putMapping', url, data);
}

EsClient.putLog = (arg) => {
  let url = endpoint(arg) + arg.index + '/' + tempType + pretty;
  return esPut('putLog', url);
}

EsClient.deleteLog = (arg) => {
  let url = endpoint(arg) + arg.index + '/' + tempType + pretty;
  return esDel('deleteLog', url);
}

EsClient.bulkInsert = (arg) => {
  let url = endpoint(arg) + '_bulk' + pretty;
  return esPost('bulkInsert', url);
};

EsClient.getTemplate = (arg) => {
  let url = endpoint(arg) + '_template/' + arg.index + pretty;
  return esGet('getTemplate', url);
};

EsClient.putTemplate = (arg) => {
  let url = endpoint(arg) + '_template/' + arg.index + pretty;
  let data = getSrcData(arg.esIndexTemplateSrc);
  if (!data) {
    Logger.error('EsClient#getSrcData Failed');
    return Promise.resolve();
  }
  return esPost('putTemplate', url, data);
};

EsClient.rollover = (arg) => {
  let url = endpoint(arg) + arg.index + '/_rollover';
  let maxAge = arg.esIndexMaxAge || DEFAULT_INDEX_MAX_AGE;
  let cond = { conditions: {} };

  if (maxAge) {
    cond.conditions.max_age = maxAge;
  }
  if (arg.maxDocs) {
    cond.conditions.max_docs = arg.maxDocs;
  }
  if (arg.maxSize) {
    cond.conditions.max_size = arg.maxSize;
  }
  return esPost('rollover', url, cond, (r) => {
    Logger.INFO('EsClient#rollover')
    Logger.INFO(util.inspect(r, false, null));
  });
};

export default EsClient;

