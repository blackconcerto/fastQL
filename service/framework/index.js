import Koa from 'koa'
import * as LoggerFactory from 'frontCommon/util/loggerFactory'
import {EStockException, ErrCode} from 'frontCommon/exception/estockException'
const httpServer = new Koa()
import routers from '../router'

const logger = LoggerFactory.getLogger('httpServer')

var bodyParser = require('koa-bodyparser');

httpServer.use(bodyParser({
	formLimit: '10mb'
}));

//
for (let routePrifix in routers){
    let crtRt = routers[routePrifix]
    httpServer.use(crtRt.routes())
    httpServer.use(crtRt.allowedMethods())
}

export function start(port) {
    httpServer.listen(port);
    logger.info('http server start on port', port)

}
