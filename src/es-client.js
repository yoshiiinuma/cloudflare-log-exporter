
import request from 'request-promise';
import MyUtils from './my-utils.js';
import Logger from './logger.js';

const DEFAULT_ENDPOINT = 'http://localhost:9200/';

let EsClient = {};

let endpoint = DEFAULT_ENDPOINT;

let postProcess = (r) => {
  console.log(r);
  return r;
};

const esGet = (url, data) => {
  return request({ url, json: true, })
    .then(postProcess)
    .catch((err) => { Logger.error(err); });
}

const esPost = (url, data) => {
  let method = 'POST';
  return request.post({ url, method, json: true }, data)
    .then(postProcess)
    .catch((err) => { Logger.error(err); });
}

const esPut = (url, data) => {
  let method = 'PUT';
  return request.put({ url, method, json: true }, data)
    .then(postProcess)
    .catch((err) => { Logger.error(err); });
}

const esDel = (url) => {
  let method = 'DELETE';
  return request.delete({ url, method, json: true })
    .then(postProcess)
    .catch((err) => { Logger.error(err); });
}

EsClient.getHealth = (arg) => {
  let url = endpoint + '_cat/health?v';
  return esGet(url);
};

EsClient.getNodes = (arg) => {
  let url = endpoint + '_cat/nodes?v';
  return esGet(url);
};

EsClient.getIndices = (arg) => {
  let url = endpoint + '_cat/indices?v';
  return esGet(url);
};

EsClient.putIndex = (arg) => {
  let url = endpoint + arg.index + '?pretty';
  return esPut(url);
}

EsClient.deleteIndex = (arg) => {
  let url = endpoint + arg.index + '?pretty';
  return esDel(url);
}

EsClient.putLog = (arg) => {
  let url = endpoint + arg.index + '_doc?pretty';
  return esPut(url);
}

EsClient.deleteLog = (arg) => {
  let url = endpoint + arg.index + '_doc?pretty';
  return esDel(url);
}

EsClient.bulkInsert = (arg) => {
  let url = endpoint + arg.index + '_doc?pretty';
  return esPost(url);
};

export default EsClient;

