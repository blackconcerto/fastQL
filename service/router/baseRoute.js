/**
 * Created by shiki on 2016/10/25.
 */
import * as LoggerFactory from 'frontCommon/util/loggerFactory'
const logger = LoggerFactory.getLogger('routerIndex')



/**
 * router的基础类
 */
import responseUtil from '../framework/middleware/responseUtil'
import resultUtil from '../framework/middleware/resultUtil'

import Router from 'koa-router'

import Config from 'frontCommon/config'
import {EStockException, ErrCode} from 'frontCommon/exception/estockException'



const router = Router()

router.prefix(Config.http.namespace);
router.use(responseUtil);
router.use(resultUtil);

export default router