
import fs from 'fs';
import request from 'request';
import { LineStream } from 'byline';

import BulkInsertConverter from './bulk-insert-converter.js';
import Logger from './logger.js';

let PushManager = {}

const DEFAULT_API_ENDPOINT = 'http://localhost:9200/'
const DEFAULT_INDEX = 'cflogs';

/**
 * arg: { date, hour, archiveDir }
 */
PushManager.read = (arg) => {
  let instream = fs.createReadStream(arg.file)
    .on('error', (err) => {
      Logger.error('PushManager#read instream');
      Logger.error(err)
    });
  let linestream = new LineStream()
    .on('error', (err) => {
      Logger.error('PushManager#read linestream');
      Logger.error(err)
    });
  let converter = new BulkInsertConverter(arg.index);

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

  if (!fs.existsSync(arg.file)) {
    Logger.error('PushManager#push File Not Found: ' + arg.file);
    return;
  } else {
    let stat = fs.statSync(arg.file);
    if (stat.size === 0) {
      Logger.info('PushManager#push Empty File: ' + arg.file);
      return;
    }
  }
  let instream = fs.createReadStream(arg.file)
    .on('error', (err) => {
      Logger.error('PushManager#push instream');
      Logger.error(err)
    });
  let linestream = new LineStream()
    .on('error', (err) => {
      Logger.error('PushManager#push linestream');
      Logger.error(err)
    });
  let converter = new BulkInsertConverter(arg.index);

  instream.pipe(linestream).pipe(converter).pipe(request.post({ url, json: true })
    .on('response', (res) => {
      if (res.statusCode === 200) {
        Logger.info('PushManager#push: ' + arg.file + ' ' + res.statusCode + ' ' + res.statusMessage);
      } else {
        Logger.error('PushManager#push: ' + arg.file + ' ' + res.statusCode + ' ' + res.statusMessage);
      }
    })
    .on('error', (err) => {
      Logger.error('PushManager#push: ' + arg.file);
      Logger.error(err)
    })
  );
}

export default PushManager;

