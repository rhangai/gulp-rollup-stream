"use strict";

const rollup = require( 'rollup' );
const memory = require( 'rollup-plugin-memory' );
const applySourceMap = require( 'vinyl-sourcemaps-apply' );
const through2 = require( 'through2' );
const extend = require( 'extend' );
const path = require( 'path' );


function resolveJs() {
	const file = path.resolve.apply( path, arguments );
	return ( path.extname( file ) !== '.js' ) ? file+'.js' : file;
}


function rollupStream( options ) {
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
		thisOptions.cache = cache;
		thisOptions.entry = file.path;
		thisOptions.plugins = [ memory({contents: file.contents.toString()}) ]
			.concat( options.plugins )
			.concat({ resolveId: resolveId });
		thisOptions.external = options.external;

		rollup.rollup( thisOptions )
			.then(function( bundle ) {
				cache = bundle;

				const generate = {
					format:     options.format || 'cjs',
					exports:    options.exports,
					moduleName: options.moduleName,
					globals:    options.globals,
				};
				if ( file.sourceMap ) {
					generate.sourceMap = true;
				}
				const result = bundle.generate( generate );
				
				const newFile = options.clone ? file.clone() : file;
				newFile.contents = new Buffer( result.code );
				if ( newFile.sourceMap ) {
					applySourceMap( newFile, result.map );
				}

				callback( null, newFile );
			}).catch(function( err ) {
				console.log( err );
				callback( err || new Error );
			})
		;
	});
};
module.exports = rollupStream;
