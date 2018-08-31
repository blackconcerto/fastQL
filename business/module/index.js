/**
 * Created by sky on 2017/10/11.
 * 用于业务模块的分拆和组合，
 * 每个业务模块固定为一般的task或者function，task参照business中的配置方式，
 * function的输入为function(ctx, param)
 *
 */
import util from 'util'
import extend from "node.extend"

import * as LoggerFactory from 'frontCommon/util/loggerFactory'

const logger = LoggerFactory.getLogger('business/module')

export function getBusinessModule(name, param, options){
	try {
		let moduleObj = require('./'+name);

		if (util.isFunction(moduleObj.default)){
			let mfc = moduleObj.default;
			return async (ctx) =>{
				if (options){
					if (options.handler){
						let runFunc = async ()=>{
							await mfc( ctx, param)
						}
						await options.handler(ctx, runFunc);
					}
					else {
						let ret = await mfc( ctx, param)
						if (options.key){
							if (options.key == "$0"){
								extend(ctx.state.result, ret);
							}
							else {
								ctx.state.result[options.key] = ret;
							}
						}
					}
				}
				else {
					let ret = await mfc( ctx, param)
				}
			}
		}
		else {
			let goFunc = moduleObj.default;
			if (util.isArray(goFunc)){
				goFunc = moduleObj.default;
				goFunc = {serial:goFunc, param:param}
			}
			else {
				goFunc = Object.assign({}, moduleObj.default);
				goFunc.param = param;
			}
			if (options){
				goFunc = extend(true, goFunc, options)
			}
			return goFunc;
		}
	}
	catch (e){
		logger.error('找不到模块', e)
	}
}