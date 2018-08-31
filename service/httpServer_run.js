


'use strict';
/**
 * Created by shiki on 2016/10/26.
 */
import config from '../config'
import CommonConfig from 'frontCommon/config'
import * as LoggerFactory from 'frontCommon/util/loggerFactory'
CommonConfig.initialize_config(config)

let cluster = require('cluster');
cluster.schedulingPolicy = cluster.SCHED_NONE;  // attention
let cpuCount = require('os').cpus().length;
var nodeNum = 2;

if (cluster.isMaster) {
    // Init master logger
    LoggerFactory.configureLogger(CommonConfig.log.masterLog  );
    cluster.on('exit', (worker, code, signal) => {
        console.log('worker %d died (%s). restarting...',
            worker.process.pid, signal || code);
        cluster.fork();
    });
    for (let i = 0; i < nodeNum; ++i) {
        cluster.fork();
    }
} else {
    LoggerFactory.configureLogger(CommonConfig.log.workerLog  );

    require('./httpServer.js')
}