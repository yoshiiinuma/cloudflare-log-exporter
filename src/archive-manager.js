
import fs from 'fs';
import path from 'path';
import { PassThrough } from 'stream';

import StreamConcat from 'stream-concat'
import zlib from 'zlib';
import utils from './utils.js';

let ArchiveManager = {}

ArchiveManager.gunzip = (infile, outfile) => {
  let gzip = zlib.createGzip();
  let outstream = fs.createWriteStream(outfile);

  fs.createReadStream(infile)
    .pipe(gzip)
    .pipe(outstream)
    .on('finish', () => {
      console.log('Archive Complete!')
    })
    .on('error', (err) => console.log(err));
}

/**
 * arg:
 *   date
 *   hour
 *   outputDir  
 */
let setupWriteStream = (ws, name) => {
  ws.on('finish', () => { console.log(name + ' finish') })
    .on('close', () => { console.log(name + ' close') })
    .on('error', (err) => { console.log(err) });
};

let createGzip = () => {
  return zlib.createGzip()
    .on('end', () => { console.log('gzip  end') })
    .on('finish', () => { console.log('gzip  finish') })
    .on('close', () => { console.log('gzip  close') })
    .on('error', (err) => { console.log(err) });
};

let createWriteStream = (fpath) => {
  let f = path.basename(fpath)
  return fs.createWriteStream(fpath)
    .on('finish', () => { console.log(f + ' end') })
    .on('close', () => { console.log(f + ' close') })
    .on('error', (err) => { console.log(err) });
};

ArchiveManager.createHourlyArchive = (arg) => {
  let dir = utils.getLogFileDir(arg.date, arg.outputDir);
  let pattern = utils.getLogFilePattern(arg.date, arg.hour); 
  let gzfile = utils.getArchiveFileName(arg);

  let files = fs.readdirSync(dir).filter((f) => {
    return pattern.test(f);
  });

  let index = 0;
  let nextStream = () => {
    if (index === files.length) {
      return null;
    }
    return fs.createReadStream(dir + '/' + files[index++]);
  }

  let gzip = createGzip();
  let outstream = createWriteStream(gzfile);
  let pt = new StreamConcat(nextStream);
  
  pt.pipe(gzip).pipe(outstream);
  console.log('Archive Complete! => ' + gzfile)
}

ArchiveManager.createDailyArchive = (date) => {
}

ArchiveManager.viewHourlyArchive = (arg) => {
  let gzfile = utils.getArchiveFileName(arg);
  let gunzip = zlib.createGunzip();
  let instream = fs.createReadStream(gzfile)
    .on('error', (err) => { console.log(err) });
  instream.pipe(gunzip).pipe(process.stdout);
}

export default ArchiveManager;

