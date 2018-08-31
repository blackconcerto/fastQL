/**
 * Created by sky on 2017/5/31.
 */
import {EStockException, ErrCode} from 'frontCommon/exception/estockException'
import * as LoggerFactory from 'frontCommon/util/loggerFactory'
const logger = LoggerFactory.getLogger('resultMiddleware')
import * as ServerUtil from 'frontCommon/util/serverUtil'


export default async (ctx, next) => {
    try{
        let actRet = await next();
        let rst = ctx.state.result;
        if (rst && rst.hasOwnProperty("retcode")){
            ctx.body = rst;
        }
        else {
            if ((!rst || Object.keys(rst).length === 0) && actRet){
                rst = actRet
            }
            if (rst){
                if (ctx.type.indexOf('application/json' ) >= 0){
                    ctx.body = ServerUtil.wrapResult(rst)
                }
                if (ctx.type.indexOf('text/plain' ) >= 0){
                    ctx.body = ServerUtil.wrapResult(rst)
                }
                if (!ctx.type){
                    ctx.body = ServerUtil.wrapResult(rst)
                }
            }
        }


    }catch(err){
        if(err instanceof EStockException){
            if (err.retcode == ErrCode.ERRCODE_ESTOCK_NOT_LOGINED){
                ctx.body = new EStockException(ErrCode.ERRCODE_ESTOCK_NOT_LOGINED, "用户未登录")
            }
            else {
                ctx.body = err
            }
        }else{
            logger.error(err.stack)
            ctx.body = new EStockException(ErrCode.ERRCODE_ESTOCK_INTERNAL_ERROR, err.message)
        }
    }
}