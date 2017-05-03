"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var rollup = require('rollup');
var memory = require('rollup-plugin-memory');
var applySourceMap = require('vinyl-sourcemaps-apply');
var through2 = require('through2');
var extend = require('extend');
var path = require('path');
var fs = require('fs');

function resolveJs() {
	var file = path.resolve.apply(path, arguments);
	return fs.existsSync(file) ? file : fs.existsSync(file + '.js') ? file + '.js' : file;
}

function rollupStream(options, bundleCb) {
	options = options || {};
	var cache = options.cache;

	function resolveId(id, importer) {
		var rootDir = options.root || process.cwd();
		if (id.substr(0, 2) === './' || id.substr(0, 3) === '../') {
			if (!importer) throw new Error("Invalid relative import");
			return resolveJs(path.dirname(importer), id);
		} else if (id.substr(0, 1) === '/') {
			return resolveJs(id);
		}
		return resolveJs(rootDir, id);
	}

	return through2.obj(function (file, enc, callback) {
		var thisOptions = {};
		if (_typeof(options.rollup) === 'object') Object.assign(thisOptions, options.rollup);

		thisOptions.cache = cache;
		thisOptions.entry = file.path;
		thisOptions.plugins = [memory({ contents: file.contents.toString() })].concat(options.plugins || []).concat({ resolveId: resolveId });
		thisOptions.external = options.external;

		var rollupOptions = thisOptions;
		if (typeof options.rollup === 'function') {
			rollupOptions = options.rollup.call(null, rollupOptions, { options: options, file: file });
			if (rollupOptions == null) rollupOptions = thisOptions;
		}

		Promise.resolve(rollupOptions).then(function (rollupOptions) {
			return rollup.rollup(rollupOptions).then(function (bundle) {
				cache = bundle;

				if (bundleCb) bundleCb(bundle);

				var generate = {
					format: options.format || 'cjs',
					exports: options.exports,
					moduleId: options.moduleId,
					moduleName: options.moduleName,
					globals: options.globals
				};
				if (_typeof(options.generate) === 'object') Object.assign(generate, options.generate);

				if (file.sourceMap) {
					generate.sourceMap = true;
					generate.sourceMapFile = file.path;
				}

				var generateOptions = generate;
				if (typeof options.generate === 'function') {
					generateOptions = options.generate.call(null, generateOptions, { file: file, rollup: rollupOptions, bundle: bundle, options: options });
					if (generateOptions == null) generateOptions = generate;
				}

				return Promise.resolve(generateOptions).then(function (generateOptions) {
					var result = bundle.generate(generateOptions);

					var newFile = options.clone ? file.clone() : file;
					newFile.contents = new Buffer(result.code);
					if (newFile.sourceMap) {
						result.map.file = newFile.sourceMap.file || result.map.file;
						applySourceMap(newFile, result.map);
					}

					callback(null, newFile);
				});
			});
		}).catch(function (err) {
			callback(err || new Error());
		});
	});
};
module.exports = rollupStream;