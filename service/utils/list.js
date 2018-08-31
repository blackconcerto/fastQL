import util from "util"
import * as LoggerFactory from 'frontCommon/util/loggerFactory'
const logger = LoggerFactory.getLogger('esFront/framework/utils/list')

export function loopToSetEmptyList(list, key) {
    for (let item of list){
        item[key] = []
    }
}