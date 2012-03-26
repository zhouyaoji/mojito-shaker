var Registry = require('../../node_modules/buildy').Registry,
    Queue = require('../../node_modules/buildy').Queue,
    Path = require('path'),
    Crypto = require('crypto'),
    Util = require('util');

function Rollup(files, options) {
    var opts = options || {};

    this._queue = new Queue('Rollup');
    this._queue.task('files', files);
    this._ext = files ? Path.extname(files[0]) : '.js';
    this._enable_checksum = opts.checksum || true;
    this._checksum = null;
}

Rollup.prototype = {
    uglify: function() {
        this._queue.task('concat');
        this._queue.task(this._ext === '.js' ? 'jsminify' : 'cssminify');
        this._queue.run();

        console.log(this._queue._state._state);

        if (this._enable_checksum) {
            var md5sum = Crypto.createHash('md5');
            md5sum.update(this._queue._state._state);
            this._checksum = md5sum.digest('hex');
        }

        return this;
    },

    write: function(name) {
        var filename = name;

        if (this._enable_checksum) {
            filename += '_' + this._checksum;
        }

        filename += this._ext;

        this._queue.task('write', {name: filename});
        return this;
    },

    run: function() {
        this._queue.run();
        return this;
    }
};

function MobstorRollup(files, options) {
    var opts = options || {};
    var registry = new Registry();
    registry.load(__dirname + '/mobstor.js'); // Path to mobstor task

    this._queue = new Queue('Rollup');
    this._queue.task('files', files);
    this._ext = files ? Path.extname(files[0]) : '.js';
    this._enable_checksum = opts.checksum || true;
    this._checksum = null;
}

Util.inherits(MobstorRollup, Rollup);

MobstorRollup.prototype.deploy = function(root, name) {
    var filename = name;

    if (this._enable_checksum) {
        filename += '_' + this._checksum;
    }

    filename += this._ext;

    queue.task('mobstor', {name: root + filename, config: this.config});
    return this;
};

(function() {
    var config = {
        host: 'playground.yahoofs.com',
        proxy: {host: "yca-proxy.corp.yahoo.com", port: 3128}
    };

    var files = ['../../docs/_build/html/_static/jquery.js', '../../docs/_build/html/_static/default.css', '../../docs/_build/html/_static/basic.css'],
        css_files = files.filter(function(f) {return Path.extname(f) == ".css";}),
        js_files = files.filter(function(f) {return Path.extname(f) == ".js";});

    new Rollup(js_files)
        .uglify()
        .write('js_rollup')
        .run();

    new Rollup(css_files)
        .uglify()
        .write('css_rollup')
        .run();
})();