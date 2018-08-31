import * as RedisDb from './globalRedis'
import * as LoggerFactory from 'frontCommon/util/loggerFactory'

const logger = LoggerFactory.getLogger('appConfigRedis')

const RedisTag = 'appConfig'

/*
	user status
*/
export async function get(){
	let cfg = await RedisDb.CONN.Get(RedisTag);
	return JSON.parse(cfg);
}
export async function set( config){
	let cfg = JSON.stringify(config||{})
	return RedisDb.CONN.Set(RedisTag, cfg )
}
export async function del(){
	return RedisDb.CONN.del(RedisTag)
}
