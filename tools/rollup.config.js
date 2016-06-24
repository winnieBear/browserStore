import uglify from 'rollup-plugin-uglify';
export default{
	moduleName:'ppStore',
  entry: '../src/index.js',
  format: 'iife',
  dest: '../dist/ppstore.js',// equivalent to --output
  //plugins:[uglify()]
};