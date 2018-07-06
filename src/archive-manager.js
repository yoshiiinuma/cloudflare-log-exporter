
import fs from 'fs';
import path from 'path';

import StreamConcat from 'stream-concat'
import zlib from 'zlib';
import MyUtils from './my-utils.js';
import Logger from './logger.js';

let ArchiveManager = {}

const setupGzip = (resolve, reject) => {
  return zlib.createGzip()
    .on('end', () => { Logger.debug('gzip end') })
    .on('finish', () => { Logger.debug('gzip finish') })
    .on('close', () => { Logger.debug('gzip close') })
    .on('error', (err) => {
      Logger.error('ArciveManager#setupGzip');
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
      Logger.error('ArciveManager#setupWriteStream');
      Logger.error(err);
      reject(err);
    });
};

/**
 * arg: { date, hour, outputDir }
 */
ArchiveManager.getHourlyLogFiles = (arg) => {
  let dir = MyUtils.getLogFileDir(arg.date, arg.outputDir);
  let pattern = MyUtils.getLogFilePattern(arg.date, arg.hour);
  if (!fs.existsSync(dir)) {
    Logger.error('ArchiveManager#getHourlyLogFiles Directory Not Exist: ' + dir);
    return [];
  }
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
    let gzfile = MyUtils.getArchiveFileName(arg);
    let r = MyUtils.getStartTime(arg) + ' => ';
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
  let gzfile = MyUtils.getArchiveFileName(arg);
  let gunzip = zlib.createGunzip()
    .on('error', (err) => {
      Logger.error('ArchiveManager#viewHourlyArchive gunzip')
      Logger.error(err)
    });
  let instream = fs.createReadStream(gzfile)
    .on('error', (err) => {
      Logger.error('ArchiveManager#viewHourlyArchive instream')
      Logger.error(err)
    });
  instream.pipe(gunzip).pipe(process.stdout);
}

export default ArchiveManager;

