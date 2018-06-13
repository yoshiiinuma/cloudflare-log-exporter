
import fs from 'fs';
import path from 'path';
import { PassThrough } from 'stream';

import StreamConcat from 'stream-concat'
import zlib from 'zlib';
import utils from './utils.js';

let ArchiveManager = {}

let debug = false;

ArchiveManager.enableDebug = () => {
  debug = true;
}

ArchiveManager.disableDebug = () => {
  debug = false;
}

const setupGzip = (resolve, reject) => {
  return zlib.createGzip()
    .on('end', () => { if (debug) console.log('gzip  end') })
    .on('finish', () => { if (debug) console.log('gzip  finish') })
    .on('close', () => { if (debug) console.log('gzip  close') })
    .on('error', (err) => {
      if (debug) console.log(err);
      reject(err);
    });
};

const setupWriteStream = (fpath, resolve, reject) => {
  let f = path.basename(fpath)
  return fs.createWriteStream(fpath)
    .on('finish', () => { if (debug) console.log(f + ' end') })
    .on('close', () => {
      if (debug) console.log(f + ' close');
      resolve();
    })
    .on('error', (err) => {
      if (debug) console.log(err);
      reject(err);
    });
};

/**
 * arg: { date, hour, outputDir }
 */
ArchiveManager.getHourlyLogFiles = (arg) => {
  let dir = utils.getLogFileDir(arg.date, arg.outputDir);
  let pattern = utils.getLogFilePattern(arg.date, arg.hour);
  let files = fs.readdirSync(dir).filter((f) => {
    return pattern.test(f);
  });
  return files;
}

/**
 * arg: { date, outputDir }
 */
const getConcatHourlyLogStreams = (arg, resolve, reject) => {
  let dir = utils.getLogFileDir(arg.date, arg.outputDir);
  let files = ArchiveManager.getHourlyLogFiles(arg)
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
ArchiveManager.createHourlyArchive = (arg) => {
  return new Promise((resolve, reject) => {
    let gzfile = utils.getArchiveFileName(arg);
    let r = utils.toLocalTime(arg) + ' => ';
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
ArchiveManager.createDailyArchive = (arg) => {
  return Promise.all(
    Array.from(Array(24).keys()).map((i) => {
      return ArchiveManager.createHourlyArchive({
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
ArchiveManager.viewHourlyArchive = (arg) => {
  let gzfile = utils.getArchiveFileName(arg);
  let gunzip = zlib.createGunzip();
  let instream = fs.createReadStream(gzfile)
    .on('error', (err) => { console.log(err) });
  instream.pipe(gunzip).pipe(process.stdout);
}

export default ArchiveManager;

