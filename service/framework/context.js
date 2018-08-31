/**
 * Created by sky on 2017/7/14.
 */
// import delegate from 'delegates'
import context from 'koa/lib/context'
import * as LoggerFactory from 'frontCommon/util/loggerFactory'
import DefaultParam from './defaultParam'
const logger = LoggerFactory.getLogger('context');

let result =  {
    get: function (oTarget, sKey) {
        // logger.debug('get result' , sKey);
        return oTarget[sKey];
    },
    set: function (oTarget, sKey, vValue) {
        // logger.debug('Set result' , sKey, vValue);
        oTarget[sKey] = vValue
        return true
    }
}

let requestResult = {
    get(target, propertyKey, receiver) {
        // logger.debug('get requestResult' , propertyKey);
        return target[propertyKey];
    },
    set(target, propertyKey, value) {
        // logger.debug('Set requestResult ' , propertyKey, value);
        target[propertyKey] = value
        return true
    }
}

let param =  {
    get(target, propertyKey, receiver) {
        // logger.debug('get param' , propertyKey);
        return target[propertyKey];
    },
    set(target, propertyKey, value) {
        // logger.debug('Set param' + propertyKey);
        target[propertyKey] = value
        return true
    }
}

let clientParam = {
    get(target, propertyKey, receiver) {
        // logger.debug('get clientParam' , propertyKey);
        return target[propertyKey];
    },
    set(target, propertyKey, value) {
        // logger.debug('Set clientParam ' , propertyKey , value);
        target[propertyKey] = value
        return true
    }
}

let temp =  {
    get(target, propertyKey, receiver) {
        // logger.debug('get temp ' , propertyKey);
        return target[propertyKey];
    },
    set(target, propertyKey, value) {
        // logger.debug('Set temp ' + propertyKey);
        target[propertyKey] = value
        return true
    }
}
let pluginVar =  {
    get(target, propertyKey, receiver) {
        // logger.debug('get pluginVar ' , propertyKey);
        return target[propertyKey];
    },
    set(target, propertyKey, value) {
        // logger.debug('Set pluginVar ' + propertyKey);
        target[propertyKey] = value
        return true
    }
}
export function createContext(ctx) {
    ctx.state.requestResult = new Proxy({},requestResult)
    ctx.state.result = new Proxy({},result)
    ctx.state.clientParam = new Proxy(ctx.reqJson,clientParam)
    ctx.state.param = new Proxy({},param)
    ctx.state.temp = new Proxy({},temp)
    ctx.state.pluginVar = new Proxy({},pluginVar);
    Object.defineProperty(ctx, 'result', {
        get:function () {
            return ctx.state.result;
        },
    });
    Object.defineProperty(ctx, 'requestResult', {
        get:function () {
            return ctx.state.requestResult;
        },
    });
    Object.defineProperty(ctx, 'clientParam', {
        get:function () {
            return ctx.state.clientParam;
        },
    });
    Object.defineProperty(ctx, 'param', {
        get:function () {
            return ctx.state.param;
        },
    });

    Object.defineProperty(ctx, 'temp', {
        get:function () {
            return ctx.state.temp;
        },
    });
    Object.defineProperty(ctx, 'pluginVar', {
        get:function () {
            return ctx.state.pluginVar;
        },
    });
    ctx.breakRequest = function () {
        ctx.state.breakRequest = 1;
    }
    return ctx
}