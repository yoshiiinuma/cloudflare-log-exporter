import request from 'request-promise';
import util from 'util';
import MyUtils from './my-utils.js';
import Logger from './logger.js';

const DEFAULT_ENDPOINT = 'http://localhost:9200/';

let EsClient = {};

let endpoint = DEFAULT_ENDPOINT;
let tempType = '_doc';
let pretty = '?pretty';
let v = '?v';

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

EsClient.putIndex = (arg) => {
  let url = endpoint + arg.index + pretty;
  return esPut(url);
}

EsClient.deleteIndex = (arg) => {
  let url = endpoint + arg.index + pretty;
  return esDel(url);
}

EsClient.getMapping = (arg) => {
  let url = endpoint + arg.index + '/_mapping/' + tempType + pretty;
  return esGet(url);
}

EsClient.putMapping = (arg) => {
  let url = endpoint + arg.index + '/_mapping/' + tempType;
  return esPut(url, mapping);
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


const mapping =
  { properties:
    { '@timestamp': { type: 'date' },
      ClientASN: { type: 'integer' },
      ClientCountry:
       { type: 'keyword', ignore_above: 2 },
      ClientDeviceType:
       { type: 'keyword', ignore_above: 16 },
      ClientIP: { type: 'ip' },
      ClientRequestHost:
       { type: 'keyword', ignore_above: 256 },
      ClientRequestMethod:
       { type: 'keyword', ignore_above: 8 },
      ClientRequestProtocol:
       { type: 'keyword', ignore_above: 16 },
      ClientRequestReferer:
       { type: 'text',
         fields: { keyword: { type: 'keyword', ignore_above: 256 } } },
      ClientRequestURI:
       { type: 'text',
         fields: { keyword: { type: 'keyword', ignore_above: 256 } } },
      ClientRequestUserAgent:
       { type: 'text',
         fields: { keyword: { type: 'keyword', ignore_above: 256 } } },
      EdgeEndTimestamp: { type: 'long' },
      EdgeResponseBytes: { type: 'integer' },
      EdgeResponseContentType:
       { type: 'text',
         fields: { keyword: { type: 'keyword', ignore_above: 64 } } },
      EdgeResponseStatus: { type: 'keyword', ignore_above: 3 },
      EdgeStartTimestamp: { type: 'long' },
      RayID:
       { type: 'text',
         fields: { keyword: { type: 'keyword', ignore_above: 40 } }
       }
    }
  };

export default EsClient;

