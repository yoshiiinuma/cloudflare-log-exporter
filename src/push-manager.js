
import fs from 'fs';
import request from 'request';
import { LineStream } from 'byline';

import BulkInsertConverter from './bulk-insert-converter.js';

let PushManager = {}

/**
 * arg: { date, hour, archiveDir }
 */
PushManager.read = (arg) => {
  let instream = fs.createReadStream(arg.file)
    .on('error', (err) => { Logger.error(err) });
  let linestream = new LineStream()
    .on('error', (err) => { Logger.error(err) });
  let converter = new BulkInsertConverter();

  instream.pipe(linestream).pipe(converter).pipe(process.stdout);
}

PushManager.push = (arg) => {
  let url = 'http://localhost:9200/_bulk'
  let instream = fs.createReadStream(arg.file)
    .on('error', (err) => { Logger.error(err) });
  let linestream = new LineStream()
    .on('error', (err) => { Logger.error(err) });
  let converter = new BulkInsertConverter();

  instream.pipe(linestream).pipe(converter).pipe(request.post({ url, json: true })
    .on('response', (res) => {
      Logger.debug(res.statusCode);
      Logger.debug(res.statusMessage);
      Logger.debug(res.headers);
    })
    .on('error', (err) => Logger.error(err))
  );
  //instream.pipe(linestream).pipe(BulkInsertConverter).pipe(process.stdout);
}

export default PushManager;

