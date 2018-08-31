/**
 * Created by shiki on 2016/10/24.
 */
import {EStockException, ErrCode} from 'frontCommon/exception/estockException'
import * as LoggerFactory from 'frontCommon/util/loggerFactory'
import * as httpUtil from 'frontCommon/util/httpUtil'

import util from 'util'

const logger = LoggerFactory.getLogger('responseUtilMiddleware')
function getDeviceType(userAgent) {
    if( userAgent == "" ){
        return "other";
    }
    let userAgentType = userAgent.toLowerCase();
    if( userAgentType.indexOf("android") >= 0 ){
        return "android";
    }
    if( userAgentType.indexOf("iphone") >= 0 ||
        userAgentType.indexOf("ipad") >= 0 ||
        userAgentType.indexOf("ios") >= 0 ){
        return "ios";
    }
    if( userAgentType.indexOf("python") >= 0 ){
        return "python";
    }
    if( userAgentType.indexOf("java") >= 0 ){
        return "java";
    }
    return "other";
}
function getVersion(userAgent) {
    if (userAgent != ""){
        let userAgengType = userAgent.toLowerCase();
        let userAgentVersion = userAgengType;
        let b=/e(ase)*stock(app)*|(\d+\.\d+)/g
        let s=userAgengType.match(b)
        if (s && s.length > 0){
            for (let i = 0;i < s.length;s++){
                if (!isNaN(s[i])){
                    userAgentVersion = s[i]
                    break
                }
            }
        }
        return userAgentVersion
    }
}




export default async (ctx, next) => {
    ctx.reqJson = {}

    Object.assign(ctx.reqJson, ctx.query)
    if(ctx.request.fields){
        Object.assign(ctx.reqJson, ctx.request.fields)
    }else{
        Object.assign(ctx.reqJson, ctx.request.body)
    }
    let device = "other",ip="", realIp = "", uuid = "", uniqueid = "", version="", logid="",esTrace=""
    if (ctx.header){
        if (ctx.header.logid){
            logid = ctx.header.logid
        }
        if (ctx.header.hasOwnProperty('estock-trace') ){
            esTrace = ctx.header['estock-trace']
        }
        if (ctx.header["x-forwarded-for"]){
            ip = ctx.header["x-forwarded-for"]
        }
        if (ctx.header["x-real-ip"]){
            realIp = ctx.header["x-real-ip"]
        }
        if (ctx.header["uuid"]){
            uuid = ctx.header["uuid"]
        }
        if (ctx.header["uniqueid"]){
            uniqueid = ctx.header["uniqueid"]
        }
        if (ctx.header["user-agent"]){
            device = getDeviceType(ctx.header['user-agent'])
            version = getVersion(ctx.header['user-agent'])
        }

    }
    logger.info(`request ${ctx.method} ${decodeURI(ctx.url)}`,
        `device:${device} ver=${version} uniqueid:${uniqueid} uuid:${uuid} X-Real-IP:${realIp} X-Forwarded-For:${ip} estock-trace:${esTrace} logid:${logid} REQ:${JSON.stringify(ctx.reqJson)}`)
    ctx.UserMsg = {device:device, version:version,uniqueid:uniqueid,uuid:uuid, realIp:realIp,'X-Forwarded-For':ip, isTrace:esTrace, isDebug:false};
    let start = Date.now();
    httpUtil.setLogid(logid);
    httpUtil.setESTrace(esTrace);
    await next();

    let delta = Math.ceil(Date.now() - start)
    let printRstStr = JSON.stringify(ctx.body), printResult={};
    if (printRstStr.length > 1000){
        try{
            let rst = ctx.body.result || ctx.body
            let printKeyList = Object.keys(rst), hasListFlag=false;
            for (let i = 0;i < printKeyList.length;i++ ){
                let printItemKey = printKeyList[i];
                let printItem = rst[printItemKey];
                if (printItem && util.isArray(printItem) && printItem.length > 0){
                    hasListFlag = true;
                    // printResult[printItemKey] = "@list:count(" + rst[printItemKey].length + '),item0: '+ JSON.stringify(rst[printItemKey][0]);
                    printResult[printItemKey] = "@list:count(" + printItem.length + ')';
                }
                else {
                    let printSubItemKeyList = [], printSubItem={}, innerListFlag=false;
                    if (util.isObject(printItem)){
                        printSubItemKeyList = Object.keys(printItem);
                    }
                    for (let i = 0;i < printSubItemKeyList.length;i++ ){
                        let printItemKey = printSubItemKeyList[i], cpSubItem = printItem[printItemKey];
                        if (cpSubItem && util.isArray(cpSubItem) && cpSubItem.length > 1){
                            innerListFlag = true
                            printSubItem[printItemKey] = "@list:count(" + cpSubItem.length + ')';
                        }
                        else {
                            printSubItem[printItemKey] = cpSubItem
                        }
                    }
                    if (innerListFlag){
                        printSubItem["KEYS"] = printSubItemKeyList.join(',')
                        printResult[printItemKey] = printSubItem
                    }
                    else {
                        printResult[printItemKey] = printItem;
                    }
                }
            }
            if (hasListFlag){
                printResult['KEYS'] = printKeyList.join(',');
            }
            printRstStr = JSON.stringify(printResult);
        }catch (e){
            logger.error(e.stack)
        }

    }
    logger.info(`response ${ctx.method} ${decodeURI(ctx.url)} ${delta}ms ret:${printRstStr}`)
}