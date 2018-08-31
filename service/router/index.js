import fs from 'fs'
import util from 'util'
import Router from 'koa-router'

import * as LoggerFactory from 'frontCommon/util/loggerFactory'
import {handleService} from '../framework/workflow'
import {EStockException, ErrCode} from 'frontCommon/exception/estockException'
import responseUtil from '../framework/middleware/responseUtil'
import resultUtil from '../framework/middleware/resultUtil'
import Config from 'frontCommon/config'

import router from './baseRoute'
const logger = LoggerFactory.getLogger('businessBaseRouter')
const defaultHandlerPath = "../../business"

let normalizedPath1 = require("path").join(__dirname, defaultHandlerPath)


function getControllers(setRouter, routePath) {
    let controllers = {}
    fs.readdirSync(routePath).forEach(function(file) {
        if (file.endsWith('.js') && file !== 'index.js') {
            let name = file.replace('.js', '');
            controllers[name] = 0;
        }
    });
    for (let f in controllers){
        let v = controllers[f];
        if (v==0){
            let p = '/'+ f;
            let cfg = require(routePath +p), attr = cfg.attr, prefix, method;
            if (attr){
                if (attr.prefix){
                    prefix = attr.prefix;
                }
                if (attr.method){
                    method = attr.method;
                }
            }
            if (prefix){
                if (!routesDict.hasOwnProperty(attr.prefix)){
                    let rt1 = Router()
                    rt.prefix('/internal');
                    rt.use(responseUtil);
                    rt.use(resultUtil);
                    setRouter = rt1;
                }
                else {
                    setRouter = routesDict[attr.prefix];
                }

            }
            let childAction = handleService(cfg);
            if (attr && attr.uri){
                p = attr.uri
            }
            if (method == 'post'){
                setRouter.post(p, childAction)
            }
            else if (method == 'get'){
                setRouter.get(p, childAction)
            }
            else {
                setRouter.all(p, childAction)
            }

        }
        else{
        }
    }

}
let routesDict = {}
routesDict[Config.http.namespace] = router;

getControllers(router, normalizedPath1);

export default routesDict;