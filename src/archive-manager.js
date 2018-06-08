
import fs from 'fs';
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
ArchiveManager.createHourlyArchive = (arg) => {
  let dir = utils.getLogFileDir(arg.date, arg.outputDir);
  let pattern = utils.getLogFilePattern(arg.date, arg.hour); 
  //let pattern = /log\.201806062001/; 
  let gzfile = utils.getArchiveFileName(arg);

  let gzip = zlib.createGzip();
  let outstream = fs.createWriteStream(gzfile);

  let files = fs.readdirSync(dir).filter((f) => {
    return pattern.test(f);
  });

  gzip.on('finish', () => {
    console.log('gzip finish')
    gzip.end();
  })
      .on('error', (err) => console.log('gzip error'))
      .on('unpipe', () => console.log('gzip unpipe'))
      .on('pipe', () => console.log('gzip pipe'))
      .on('drain', () => console.log('gzip drain'))
      .on('close', () => console.log('gzip close'))
      .on('data', (data) => {
        console.log(' ===> gzip');
        outstream.write(data);
      });

  outstream.on('finish', () => {
    console.log('outstream finish')
    outstream.end();
  })
      .on('error', (err) => console.log('outstream error'))
      .on('unpipe', () => console.log('outstream unpipe'))
      .on('pipe', () => console.log('outstream pipe'))
      .on('drain', () => console.log('outstream drain'))

  //console.log(files);
  //files.forEach((f) => console.log(f));

  files.reduce((promise, f) => {
    return promise.then(() => {
      return new Promise((resolve, reject) => {
        let buff = '';
        let stream = fs.createReadStream(dir + '/' + f)
          .on('end', () => {
            console.log('Done  ' + f)
          })
          .on('data', (data) => {
             console.log(' ---> ' + f);
             buff += data; 
             //gzip.write(data);
          })
          .on('close', () => {
            console.log('Close ' + f)
            gzip.write(buff);
            resolve();
          })
          .on('error', (err) => {
            console.log(err)
            reject(err);
          });
      })
    });
  }, Promise.resolve());

  //files.forEach((f) => {
  //  //let stream = fs.createReadStream(dir + '/' + f, { end: false })
  //  let stream = fs.createReadStream(dir + '/' + f)
  //    .on('end', () => {
  //      console.log('Done ' + f)
  //    })
  //    .on('data', (data) => {
  //       gzip.write(data);
  //    })
  //    .on('close', () => console.log('Close ' + f))
  //    .on('error', (err) => console.log(err));
  //});
  //gzip.end();
  //outstream.end();
  console.log('Archive Complete! => ' + gzfile)
}

ArchiveManager.createDailyArchive = (date) => {
}

export default ArchiveManager;

