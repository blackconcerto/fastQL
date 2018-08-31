import Router from 'koa-router'
import fs from 'fs'
import * as LoggerFactory from 'frontCommon/util/loggerFactory'
import responseUtil from '../framework/middleware/responseUtil'
import router from './baseRoute'
import routes from './index'
const logger = LoggerFactory.getLogger('controllerRouter')
// import body from 'koa-better-body'
const defaultHandlerPath = "./handler"

let normalizedPath = require("path").join(__dirname, defaultHandlerPath)

let controllers = getControllers();

let routesDict = {}
for (let r of routes){
    addRoute(r);
    if (controllers.hasOwnProperty(r.handler)){
        controllers[r.handler] = 1
    }
}

for (let f in controllers){
    let v = controllers[f];
    if (v==0){
        let func = require(normalizedPath +'/'+ f);
        for (let singleAction in func){
            if (singleAction.endsWith('Action')){
                let childAction = getChildAction(func[singleAction])

                router.get('/'+f, childAction)
                router.post('/'+f,  childAction)
                break
            }

        }

    }
    else{

    }
}

function getControllers() {
    let controllers = {}
    fs.readdirSync(normalizedPath).forEach(function(file) {
        if (file.match(/\.js$/) !== null && file !== 'index.js') {
            let name = file.replace('.js', '');
            controllers[name] = 0;
        }
    });
    return controllers;
}


function addRoute(r) {
    let rt = router;
    if (r.hasOwnProperty('prefix') && r.prefix.length > 0){
        if (routesDict.hasOwnProperty('prefix')){
            rt = routesDict[r.prefix]
        }
        else {
            rt = Router()
            rt.prefix(r.prefix)
            // rt.use(body());
            rt.use(responseUtil);
            routesDict[r.prefix] = rt;
        }
    }
    var action = null;
   if(r.handler){
        try {
            if (r.handler.indexOf('/') >= 0){
                action = require('../'+r.handler)
            }
            else {
                action = require( defaultHandlerPath + r.handler)
            }
        }
        catch (e){
            logger.error('can not find handler', e.stack)
        }

    }
    if (action){
        for (let singleAction in action){
            if (singleAction.endsWith('Action')){
                let childAction = getChildAction(action[singleAction])
                if (r.method == 'post'){
                    rt.post(r.uri, childAction)
                }
                else if (r.method == 'get'){
                    rt.get(r.uri, childAction)
                }
                else {
                    rt.all(r.uri, childAction)
                }
                break
            }

        }
    }
}


export function getChildAction(actionFunc){

    return async function (ctx) {
        let cookie = ctx.cookie  || ctx.header.cookie || "";
        return await actionFunc(ctx.reqJson, cookie, ctx);
    }
}


export default routesDict