/**
 * Created by sky on 2017/3/18.
 */
// require('./httpServer_run.js')
require('babel-register')({
    presets: [ 'es2015', "stage-0" ]
});
require('babel-polyfill')

require('./service/httpServer.js')