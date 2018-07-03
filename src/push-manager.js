
import fs from 'fs';
import request from 'request';
import { LineStream } from 'byline';

import BulkInsertConverter from './bulk-insert-converter.js';
import BulkInserter from './bulk-inserter.js';
import Logger from './logger.js';

let PushManager = {}

const DEFAULT_API_ENDPOINT = 'http://localhost:9200/'
const DEFAULT_INDEX = 'cflogs';

const RGX_HTML = /<html>/;
const RGX_TOOMANYREQS = /Too Many Requests/;

/**
 * arg: { date, hour, archiveDir }
 */
PushManager.read = (arg) => {
  let file = arg.file;
  let index = arg.index;

  if (!fs.existsSync(file)) {
    Logger.error('PushManager#read File Not Found: ' + file);
    return;
  } else {
    Logger.debug(file)
    let stat = fs.statSync(file);
    if (stat.size === 0) {
      Logger.info('PushManager#read Empty File: ' + file);
      return;
    }
    if (stat.size === 178) {
      let contents = fs.readFileSync(file);
      if (RGX_TOOMANYREQS.test(contents)) {
        Logger.error('PushManager#read 429 Too Many Requests: ' + file);
        return;
      }
    }
  }
  let instream = fs.createReadStream(file)
    .on('error', (err) => {
      Logger.error('PushManager#read instream');
      Logger.error(err)
    });
  let linestream = new LineStream()
    .on('error', (err) => {
      Logger.error('PushManager#read linestream');
      Logger.error(err)
    });
  let converter = new BulkInsertConverter(index);

  instream.pipe(linestream).pipe(converter).pipe(process.stdout);
}

/**
 * arg: { esApiEndpoint, index, file } 
 *      file: path to a raw CloudFlare log json file
 */
PushManager.push = (arg) => {
  let url = arg.esApiEndpoint || DEFAULT_API_ENDPOINT; 
  url += '_bulk';
  let index = arg.index || arg.IndexNameCurrent || DEFAULT_INDEX;
  let file = arg.file;

  if (!fs.existsSync(file)) {
    Logger.error('PushManager#push File Not Found: ' + file);
    return;
  } else {
    let stat = fs.statSync(file);
    if (stat.size === 0) {
      Logger.info('PushManager#push Empty File: ' + file);
      return;
    }
    if (stat.size === 178) {
      let contents = fs.readFileSync(file);
      if (RGX_TOOMANYREQS.test(contents)) {
        Logger.error('PushManager#read 429 Too Many Requests: ' + file);
        return;
      }
    }
  }
  let instream = fs.createReadStream(file)
    .on('error', (err) => {
      Logger.error('PushManager#push instream');
      Logger.error(err)
    });
  let linestream = new LineStream()
    .on('error', (err) => {
      Logger.error('PushManager#push linestream');
      Logger.error(err)
    });
  let converter = new BulkInsertConverter(index);
  let inserter = new BulkInserter(url, file);

  instream.pipe(linestream).pipe(converter).pipe(inserter);
}

export default PushManager;

