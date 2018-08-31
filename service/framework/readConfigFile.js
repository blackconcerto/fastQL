import fs from 'fs'
import * as LoggerFactory from 'frontCommon/util/loggerFactory'
const logger = LoggerFactory.getLogger('readAppConfig')

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
