
import { Transform } from 'stream'

const DEFAULT_INDEX = 'test';

class BulkInsertConverter extends Transform {
  constructor(index = DEFAULT_INDEX, options = {}) {
    super(options);
    this.index = index;
  }

  _transform(chunk, encoding, callback) {
    let json = JSON.parse(chunk.toString());
    json['@timestamp'] = new Date(json.EdgeStartTimestamp/1000000);
    let msg = "{\"index\":{\"_index\":\"" + this.index + "\",\"_type\":\"_doc\"}}\n";
    msg += JSON.stringify(json) + "\n";
    this.push(msg);
    callback();
  }
}

export default BulkInsertConverter;
