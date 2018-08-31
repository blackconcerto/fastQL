import * as RedisDb from 'frontCommon/database/redisDb'
import Config from 'frontCommon/config'

export const CONN = RedisDb.RedisDb(Config.redis)