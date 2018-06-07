
import fs from 'fs';
import utils from './utils.js';
import logClient from './log-client.js';

function usage() {
  console.log("\n Usage: npm run archive -- [OPTIONS]");
  console.log(" Usage: node dist/archive.js [OPTIONS]");
  console.log("\n   OPTIONS");
  console.log("     -e or --env:        development|production default development");
  console.log("     --date:             local time YYYY-MM-DD");
  console.log("     --hour:             0-23");
  console.log("     -h or --help:       show this message");
  console.log();
}


var opt = {
  env: 'development',
  date: new Date(2018, 6, 6)
};

var args = process.argv.slice(2);

while(args.length > 0) {
  let arg = args.shift();
  if (arg === '-h' || arg === '--help') {
    usage();
    process.exit();
  } else if (arg === '-e' || arg === '--env') {
    opt.env = args.shift();
  } else if (arg === '--date') {
    opt.originalDate = args.shift();
  } else if (arg === '--hour') {
    opt.originalHour = args.shift();
  } else {
    console.log('Invalid Argument: ' + arg);
    usage();
    process.exit();
  }
}

if (opt.env != 'development' && opt.env != 'production') {
  console.log(" Invalid Environment: " + opt.env);
  usage();
  process.exit();
}

opt.date = utils.parseDate(opt.originalDate, opt.originalHour);

let confFile = './config/' + opt.env + '.json';
const conf = utils.jsonToObject(confFile);
if (!conf) {
  console.log('Configuration File Not Found: ' + confFile);
  usage();
  process.exit();
}

let arg = Object.assign(conf, opt);

let infile = 'log.20180606190000-20180606190100.json';
let outfile = '201806061900.gz';

import zlib from 'zlib';

let gzip = zlib.createGzip();
let outstream = fs.createWriteStream(outfile);

fs.createReadStrema(infile)
  .pipe(gzip)
  .pipe(outstream)
  .on('finish', () => {
    console.log('Archive Complete!')
  });
