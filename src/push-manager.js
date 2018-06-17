
import fs from 'fs';
import path from 'path';
import { LineStream } from 'byline';

import StreamConcat from 'stream-concat'
import zlib from 'zlib';
import MyUtils from './my-utils.js';
import Logger from './logger.js';

let PushManager = {}

const setupGzip = (resolve, reject) => {
  return zlib.createGzip()
    .on('end', () => { Logger.debug('gzip end') })
    .on('finish', () => { Logger.debug('gzip finish') })
    .on('close', () => { Logger.debug('gzip close') })
    .on('error', (err) => {
      Logger.error(err);
      reject(err);
    });
};

const setupWriteStream = (fpath, resolve, reject) => {
  let f = path.basename(fpath)
  return fs.createWriteStream(fpath)
    .on('finish', () => { Logger.debug(f + ' end') })
    .on('close', () => {
      Logger.debug(f + ' close');
      resolve();
    })
    .on('error', (err) => {
      Logger.error(err);
      reject(err);
    });
};

/**
 * arg: { date, hour, outputDir }
 */
PushManager.getHourlyLogFiles = (arg) => {
  let dir = MyUtils.getLogFileDir(arg.date, arg.outputDir);
  let pattern = MyUtils.getLogFilePattern(arg.date, arg.hour);
  let files = fs.readdirSync(dir).filter((f) => {
    return pattern.test(f);
  });
  return files;
}

/**
 * arg: { date, outputDir }
 */
const getConcatHourlyLogStreams = (arg, resolve, reject) => {
  let dir = MyUtils.getLogFileDir(arg.date, arg.outputDir);
  let files = PushManager.getHourlyLogFiles(arg)
  if (files.length == 0) return null;

  let index = 0;
  let nextStream = () => {
    if (index === files.length) {
      return null;
    }
    return fs.createReadStream(dir + '/' + files[index++])
      .on('error', (err) => reject(err));
  }

  return new StreamConcat(nextStream);
}

/**
 * arg: { date, hour, archiveDir, outputDir }
 */
PushManager.createHourlyArchive = (arg) => {
  return new Promise((resolve, reject) => {
    let gzfile = MyUtils.getArchiveFileName(arg);
    let r = MyUtils.toLocalTime(arg) + ' => ';
    let success = () => { resolve(r + gzfile) }
    let gzip = setupGzip(resolve, reject);
    let outStream = setupWriteStream(gzfile, success, reject);
    let inputStreams = getConcatHourlyLogStreams(arg, resolve, reject);

    if (!inputStreams) { resolve(r + 'none'); }
    inputStreams.pipe(gzip).pipe(outStream);
  });
}

/**
 * arg: { date, archiveDir, outputDir }
 */
PushManager.createDailyArchive = (arg) => {
  return Promise.all(
    Array.from(Array(24).keys()).map((i) => {
      return PushManager.createHourlyArchive({
        date: arg.date,
        hour: i,
        outputDir: arg.outputDir
      });
    })
  );
}

/**
 * arg: { date, hour, archiveDir }
 */
PushManager.read = (arg) => {
  let instream = fs.createReadStream(arg.file)
    .on('error', (err) => { Logger.error(err) });
  let linestream = new LineStream()
    .on('data', (l) => { console.log(l.toString());console.log('-----------------------------') })
    .on('error', (err) => { Logger.error(err) });

  //instream.pipe(linestream).pipe(process.stdout);
  instream.pipe(linestream);
}

export default PushManager;

