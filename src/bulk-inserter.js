
import request from 'request';
import { Writable } from 'stream'

import Logger from './logger.js';

const MAXCNT = 5000;

class BulkInserter extends Writable {

  constructor(url, file) {
    super();
    this.url = url;
    this.file = file;
    this.count = 0;
    this.seq = 0;
    this.buff = '';
  }

  _write(chunk, encoding, callback) {
    this.count++;
    this.buff += chunk;
    if (this.count % MAXCNT === 0) {
      this.seq++;
      this._insert(this.buff, this.seq, this.count);
      this.buff = '';
    }
    callback();
  }

  _final(callback) {
    if (this.buff.length > 0) {
      this.seq++;
      this._insert(this.buff, this.seq, this.count);
      this.buff = '';
    }
    callback();
  }

  _insert(data, seq, count) {
    request.post({ url: this.url, body: data, headers: { 'Content-Type': 'application/x-ndjson' } })
      .on('response', (res) => {
        if (res.statusCode === 200) {
          Logger.info(this._preDbgMsg(seq, count) + ' ' + res.statusCode + ' ' + res.statusMessage);
        } else {
          Logger.error(this._preDbgMsg(seq, count) + ' ' + res.statusCode + ' ' + res.statusMessage);
        }
      })
      .on('error', (err) => {
        Logger.error(this._preDbgMsg(seq, count));
        Logger.error(err)
      })
  }

  _preDbgMsg(seq, total) {
    return 'BulkInserter#insert: ' + this.file + ' ' + 
      seq.toString().padStart(4, '0') +
      total.toString().padStart(7, ' ');
  }
}

export default BulkInserter;
