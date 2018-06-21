import request from 'request-promise';
import util from 'util';
import MyUtils from './my-utils.js';
import Logger from './logger.js';

const DEFAULT_ENDPOINT = 'http://localhost:9200/';
const DEFAULT_INDEX_MAX_AGE = '10d';

let EsClient = {};

let endpoint = DEFAULT_ENDPOINT;
const tempType = '_doc';
const pretty = '?pretty';
const v = '?v';

let postProcess = (r) => {
  console.log(util.inspect(r, false, null));
  return r;
};

const esGet = (url, data) => {
  return request({ url, json: true, })
    .then(postProcess)
    .catch((err) => { Logger.error(err); });
}

const esPost = (url, data) => {
  let method = 'POST';
  return request.post({ url, method, json: true, body: data })
    .then(postProcess)
    .catch((err) => { Logger.error(err); });
}

const esPut = (url, data) => {
  let method = 'PUT';
  console.log(url);
  console.log(data);
  return request.put({ url, method, json: true, body: data })
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
  let url = endpoint + '_cat/health' + v;
  return esGet(url);
};

EsClient.getNodes = (arg) => {
  let url = endpoint + '_cat/nodes' + v;
  return esGet(url);
};

EsClient.getTemplate = (arg) => {
  let url = endpoint + '_template' + pretty;
  return esGet(url);
};

EsClient.getIndices = (arg) => {
  let url = endpoint + '_cat/indices' + v;
  return esGet(url);
};

EsClient.getIndex = (arg) => {
  let url = endpoint + arg.index + pretty;
  console.log(url);
  return esGet(url);
};

//FIXME Do NOT use the hard-coded file name
EsClient.putIndex = (arg) => {
  let url = endpoint + arg.index + pretty;
  let data = MyUtils.jsonToObject('./config/index.json');
  return esPut(url, data);
}

EsClient.deleteIndex = (arg) => {
  let url = endpoint + arg.index + pretty;
  return esDel(url);
}

EsClient.getMapping = (arg) => {
  let url = endpoint + arg.index + '/_mapping/' + tempType + pretty;
  return esGet(url);
}

//FIXME Do NOT use the hard-coded file name
EsClient.putMapping = (arg) => {
  let url = endpoint + arg.index + '/_mapping/' + tempType;
  let data = MyUtils.jsonToObject('./config/mapping.json');
  return esPut(url, data);
}

EsClient.putLog = (arg) => {
  let url = endpoint + arg.index + '/' + tempType + pretty;
  return esPut(url);
}

EsClient.deleteLog = (arg) => {
  let url = endpoint + arg.index + '/' + tempType + pretty;
  return esDel(url);
}

EsClient.bulkInsert = (arg) => {
  let url = endpoint + '_bulk' + pretty;
  return esPost(url);
};

EsClient.getTemplate = (arg) => {
  let url = endpoint + '_template/' + arg.index + pretty;
  return esGet(url);
};

//FIXME Do NOT use the hard-coded file name
EsClient.putTemplate = (arg) => {
  let url = endpoint + '_template/' + arg.index + pretty;
  let data = MyUtils.jsonToObject('./config/template.json');
  return esPost(url, data);
};

EsClient.rollover = (arg) => {
  let url = endpoint + arg.index + '/_rollover';
  let maxAge = arg.maxAge || DEFAULT_INDEX_MAX_AGE;
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
  return esPost(url, cond);
};

const tempTemplate = {
  "template": "cflogs-*",
  "settings": {
    "index": {
      "number_of_shards": 5,
      "number_of_replicas": 1,
      "routing.allocation.include.box_type": "hot",
      "routing.allocation.total_shards_per_node": 1
    }
  },
  "aliases": {
    "all-cflogs": {}
  }
};

export default EsClient;

