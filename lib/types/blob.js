var Transform = require('stream').Transform,
    inherits = require('util').inherits,
    parseParams = require('../utils').parseParams,
    decodeText = require('../utils').decodeText,
    basename = require('../utils').basename;

var RE_FILENAME = /^filename$/i,
    RE_NAME = /^name$/i;

function Blob(boy, cfg) {
    if (!(this instanceof Blob))
        return new Blob(boy, cfg);

    Transform.call(this, cfg);

    this.boy = boy;
    this.started = false;

    this.encoding = cfg.headers['content-transfer-encoding']?
        cfg.headers['content-transfer-encoding'][0].toLowerCase() : '7bit';

    this.mimeType = 'text/plain';

    if (cfg.headers['content-type']) {
        parsed = parseParams(cfg.headers['content-type']);
        if (parsed[0]) {
            this.mimeType = parsed[0].toLowerCase();
        }
    }

    this.fieldname = null;
    this.filename = null;

    if (cfg.headers['content-disposition']) {
        parsed = parseParams(cfg.headers['content-disposition']);
        for (i = 0, len = parsed.length; i < len; ++i) {
            if (RE_NAME.test(parsed[i][0])) {
                this.fieldname = decodeText(parsed[i][1], 'binary', 'utf8');
            } else if (RE_FILENAME.test(parsed[i][0])) {
                this.filename = decodeText(parsed[i][1], 'binary', 'utf8');
                if (!cfg.preservePath)
                    this.filename = basename(this.filename);
            }
        }
    }
}
inherits(Blob, Transform);

Blob.detect = /.*/i;

Blob.prototype._transform = function(chunk, encoding, callback) {
  if (!this.started) {
    this.started = true;
    this.boy.emit('file', this.fieldname, this, this.filename, this.encoding, this.mimeType);
  }

  this.push(chunk);
  callback();
};


module.exports = Blob;
