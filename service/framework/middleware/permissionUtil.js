/**
 * Created by sky on 2017/5/31.
 */
import {EStockException, ErrCode} from 'frontCommon/exception/estockException'
import * as LoggerFactory from 'frontCommon/util/loggerFactory'
import * as requestUtil from 'frontCommon/util/requestUtil'

const logger = LoggerFactory.getLogger('resultMiddleware')
import CryptoJS from 'crypto-js'
import Config from 'frontCommon/config'


export default async (ctx, next) => {
    try{
        let req = ctx.reqJson;
        if (Config.constant.useSign){
            let sign = req.sign;
            if (!sign){
                ctx.body = new EStockException(ErrCode.ERRCODE_ESTOCK_NOT_FOUND, "缺少签名")
            }
            delete req.sign;
            let entries = Object.entries(req);
            entries.sort(function (a, b) {
                let akey = a[0], bkey = b[0];
                if (akey > bkey){
                    return 1;
                }
                else if (akey < bkey){
                    return -1;
                }
                else {
                    return 0;
                }
            })
            let paramList = [];
            for (let entry of entries){
                paramList.push(entry[0]+ '='+ entry[1])
            }
            let paramStr = paramList.join('&');
            let hashStr = CryptoJS.HmacSHA1(paramStr, Config.constant.signKey).toString(CryptoJS.enc.Hex);
            if (hashStr != sign){
                ctx.body = new EStockException(ErrCode.ERRCODE_ESTOCK_NOT_FOUND, "签名错误")
                return
            }
        }
        if (Config.constant.validateCooperator){
            let uniqueId = ctx.UserMsg.uniqueid;
            let uri = ctx.path;
            let sourceIp = ctx.UserMsg.realIp;
            let permissionParam = {uri:uri,sourceIp:sourceIp, uniqueId:uniqueId,cooperatorId:Config.constant.cooperatorId,
                cooperatorIp:Config.constant.cooperatorIp};
            try{
                let permissionRst = await requestUtil.accessService(Config.api.permission+'/permission/validateCooperator',permissionParam, ctx);
            }
            catch (e){
                ctx.body = new EStockException(ErrCode.retcode, e.retmsg)
                return
            }
        }
        await next();
    }catch(err){
        if(err instanceof EStockException){
            ctx.body = err
        }else{
            logger.error(err.stack)
            ctx.body = new EStockException(ErrCode.ERRCODE_ESTOCK_INTERNAL_ERROR, err.message)
        }
    }
}