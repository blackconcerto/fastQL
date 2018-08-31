/**
 * Created by shiki on 2016/10/26.
 */
import config from '../config'
import CommonConfig from 'frontCommon/config'
import * as LoggerFactory from 'frontCommon/util/loggerFactory'


CommonConfig.initialize_config(config)

LoggerFactory.configureLogger(config.log.masterLog  );


const httpServer = require('./framework')
httpServer.start(config.http.port)



//多进程下的异步共用变量可能会不同步，
// import CommonConfig from 'frontCommon/config'
// import config from '../config'
// CommonConfig.initialize_config(config)
//
// const httpServer = require('./framework')
// httpServer.start(config.http.port)
