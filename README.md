gulp-rollup-stream
====================================

Usage
------------------------------------

### Basic usage ###
```js
	const gulp   = require( 'gulp' );
	const rollup = require( 'gulp-rollup-stream' );
	
	gulp.task( 'rollup', function() {
		return gulp.src( 'src/main.js' )
			.pipe(rollup({
				format: 'cjs'
			})
			.pipe( gulp.dest( 'build' ) )
		;	
	});
```


Documentation
-------------------------------------

### rollup( options[, bundleCb] ) ###
	
Create a rollup-stream. Check [Rollup documenation](https://github.com/rollup/rollup/wiki/JavaScript-API) for more options

- bundleCb: Everytime a new bundle this callback is called using: `bundleCb( bundle )`
    Useful for cache: 
```js
var cache;
function bundleCb( bundle ) { cache = bundle; }
```

- options.root: The path where to look at modules at first when using `import mod from 'my/module'.`
It will look into `path.resolve( options.root,  'my/module' );`

#### Rollup options supported ####
- Rollup Options
	- [options.cache](https://github.com/rollup/rollup/wiki/JavaScript-API#cache)
	- [options.external](https://github.com/rollup/rollup/wiki/JavaScript-API#external)
	- [options.plugins](https://github.com/rollup/rollup/wiki/JavaScript-API#plugins)

- Generate Options
	- [options.format](https://github.com/rollup/rollup/wiki/JavaScript-API#format)
	- [options.exports](https://github.com/rollup/rollup/wiki/JavaScript-API#exports)
	- [options.moduleId](https://github.com/rollup/rollup/wiki/JavaScript-API#moduleid)
	- [options.moduleName](https://github.com/rollup/rollup/wiki/JavaScript-API#modulename)
	- [options.globals](https://github.com/rollup/rollup/wiki/JavaScript-API#globals)
	
- options.rollup

	If an object, this option will be merged directly to the options passed to rollup.rollup( options ).
	
	If a function, will be called with the first parameter the options that will be passed to rollup.rollup and a second extra parameter with many other infos. If this function return a promise, it will be resolved before it is passed to rollup

- options.generate
	Same as above, but for generate
		
	
