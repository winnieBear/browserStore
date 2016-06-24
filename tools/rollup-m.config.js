import uglify from 'rollup-plugin-uglify';
export default{
	moduleName:'ppStore',
  entry: '../src/index-m.js',
  format: 'iife',
  dest: '../dist/ppstore-m.js',// equivalent to --output
  //plugins:[uglify()]
};