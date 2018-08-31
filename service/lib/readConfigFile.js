import fs from 'fs'
import * as LoggerFactory from 'frontCommon/util/loggerFactory'
const logger = LoggerFactory.getLogger('readAppConfig')
import {EStockException, ErrCode} from 'frontCommon/exception/estockException'

export function readConfig(rootPath) {

    try {
        let data= fs.readFileSync(rootPath,"utf-8");
        let cfgJson = JSON.parse(data);
        if (cfgJson){
            return cfgJson;
        }
        else {
            return {}
        }
    }
    catch (e){
        logger.error(e.stack);
        throw new Error(e.stack);
    }
}

export function writeConfig(rootPath, data) {

    try {
        fs.writeFileSync(rootPath, JSON.stringify(data));
    }
    catch (e){
        logger.error(e.stack);
        throw new Error(e.stack);
    }
}


export function writePrettyJson(rootPath, data) {

    try {
        fs.writeFileSync(rootPath, JSON.stringify(data, null, 4));
    }
    catch (e){
        logger.error(e.stack);
        throw new Error(e.stack);
    }
}

export function writePrettyConfig(rootPath, data) {

    try {
        fs.writeFileSync(rootPath, 'export default ', {flag:'w+'});
        fs.writeFileSync(rootPath, JSON.stringify(data, null, 4),{flag:'a'});
    }
    catch (e){
        logger.error(e.stack);
        throw new Error(e.stack);
    }
}

export function backupConfig(rootPath) {
    return new Promise((resolve, reject) => {
        fs.rename(rootPath,rootPath+'.bk', function(err){
            if(err){
                logger.error(err);
                reject(new EStockException(ErrCode.ERRCODE_ESTOCK_INTERNAL_ERROR, '备份配置文件失败'))
            }
            logger.info('backup ', rootPath, ' success');
            resolve({succ:true})
        })
    })
}