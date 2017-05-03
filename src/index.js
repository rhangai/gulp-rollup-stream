"use strict";

const rollup = require( 'rollup' );
const memory = require( 'rollup-plugin-memory' );
const applySourceMap = require( 'vinyl-sourcemaps-apply' );
const through2 = require( 'through2' );
const extend = require( 'extend' );
const path = require( 'path' );
const fs = require( 'fs' );

function resolveJs() {
	const file = path.resolve.apply( path, arguments );
	return fs.existsSync( file ) ? file : fs.existsSync( file+'.js' ) ? file+'.js' : file;
}

function rollupStream( options, bundleCb ) {
	options = options || {};
	var cache = options.cache;
	
	function resolveId( id, importer ) {
		const rootDir = options.root || process.cwd();
		if ( ( id.substr( 0, 2 ) === './' ) || ( id.substr( 0, 3 ) === '../' ) ) {
			if ( !importer )
				throw new Error( "Invalid relative import" );
			return resolveJs( path.dirname( importer ), id );
		} else if ( id.substr( 0, 1 ) === '/' ) {
			return resolveJs( id );
		}
		return resolveJs( rootDir, id );
	}
	
	return through2.obj( function( file, enc, callback ) {
		const thisOptions = {};
		if ( typeof(options.rollup) === 'object' )
			Object.assign( thisOptions, options.rollup );
		
		thisOptions.cache = cache;
		thisOptions.entry = file.path;
		thisOptions.plugins = [ memory({contents: file.contents.toString()}) ]
			.concat( options.plugins || [] )
			.concat({ resolveId: resolveId });
		thisOptions.external = options.external;

		let rollupOptions = thisOptions;
		if ( typeof(options.rollup) === 'function' ) {
			rollupOptions = options.rollup.call( null, rollupOptions, { options: options, file: file } );
			if ( rollupOptions == null )
				rollupOptions = thisOptions;
		}

		Promise.resolve( rollupOptions )
			.then(function( rollupOptions ) {
				return rollup.rollup( rollupOptions )
					.then(function( bundle ) {
						cache = bundle;

						if ( bundleCb )
							bundleCb( bundle );

						const generate = {
							format:     options.format || 'cjs',
							exports:    options.exports,
							moduleId:   options.moduleId,
							moduleName: options.moduleName,
							globals:    options.globals,
						};
						if ( typeof(options.generate) === 'object' )
							Object.assign( generate, options.generate );

						if ( file.sourceMap ) {
							generate.sourceMap     = true;
							generate.sourceMapFile = file.path;
						}


						let generateOptions = generate;
						if ( typeof(options.generate) === 'function' ) {
							generateOptions = options.generate.call( null, generateOptions, { file: file, rollup: rollupOptions, bundle: bundle, options: options } );
							if ( generateOptions == null )
								generateOptions = generate;
						}

						return Promise.resolve( generateOptions )
							.then(function( generateOptions ) {
								const result = bundle.generate( generateOptions );
								
								const newFile = options.clone ? file.clone() : file;
								newFile.contents = new Buffer( result.code );
								if ( newFile.sourceMap ) {
									result.map.file = newFile.sourceMap.file || result.map.file;
									applySourceMap( newFile, result.map );
								}
								
								callback( null, newFile );
							});
					})
				;
			}).catch(function( err ) {
				callback( err || new Error );
			})
		;
	});
};
module.exports = rollupStream;
