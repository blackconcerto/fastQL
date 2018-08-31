import {EStockException, ErrCode} from 'frontCommon/exception/estockException'
import * as LoggerFactory from 'frontCommon/util/loggerFactory'

const logger = LoggerFactory.getLogger('sample');



export default [
	{
		target:'/topic/list',
		param:['type'],
		handler:async function(ctx, httpReq) {
			let ret = await httpReq();
			logger.debug('-------------', ret)
		}
	},
]