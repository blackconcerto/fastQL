import * as LoggerFactory from 'frontCommon/util/loggerFactory'
import Config from 'frontCommon/config'
import * as AppConfig from '../model/appConfigRedis'
import extend from 'node.extend'
const logger = LoggerFactory.getLogger('initConfig'),Constant = Config.constant;

export async function readConfig() {

    try {
        let cfg = await AppConfig.get();
        Constant.appConfig = extend(Constant.appConfig, cfg);
        logger.info(Constant.appConfig)
    }
    catch (e){
        logger.error(e.stack);
        throw new Error(e.stack);
    }
}
export async function setConfig() {

    try {
        await AppConfig.get(Constant.AppConfig);
    }
    catch (e){
        logger.error(e.stack);
        throw new Error(e.stack);
    }
}
