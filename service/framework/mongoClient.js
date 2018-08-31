/**
 * Created by sky on 2017/11/28.
 */
import Config from 'frontCommon/config'
import * as LoggerFactory from 'frontCommon/util/loggerFactory'
import {EStockException, ErrCode} from 'frontCommon/exception/estockException'
import {MongoClient, Long} from 'mongodb'
const logger = LoggerFactory.getLogger('mongoClient');

let  mongoClients = {}, mongoModels={};
const opKey = ['get', 'delete','update','add','List'], opReg=/(By|List|TotalList)/, startKey=/^(count|get|delete|update|add)/;
const DBCfg = Config.db;

export async function getMongoConnection(db) {
	if (mongoClients[db]){
		return mongoClients[db];
	}
	let cfgStr = db + 'Mongo';
	if (!DBCfg.hasOwnProperty(cfgStr)){
		logger.error(db, "have not config");
		return false;
	}

	let connectUrl = DBCfg[cfgStr].connectUrl;
	if (!connectUrl){
		connectUrl = `mongodb://${DBCfg[cfgStr].connection.user}:${DBCfg[cfgStr].connection.password}@${DBCfg[cfgStr].connection.host}:${DBCfg[cfgStr].connection.port}/${DBCfg[cfgStr].connection.database}`
	}
	mongoClients[db] = await MongoClient.connect(connectUrl);
	if (DBCfg[cfgStr].connection.switchDb){
		mongoClients[db] = await mongoClients[db].db(DBCfg[cfgStr].connection.switchDb);
	}
	return mongoClients[db];
}

export function parseDbTarget(s) {
	let match, op="", table="", condition="", cdtStr="";
	// while (match= opReg.exec(s))
	//     indexes.push([match.index, match[0].length]);
	// let parseLen = indexes.length;
	// if (parseLen < 1 || parseLen > 2){
	//     throw new EStockException(ErrCode.ERRCODE_ESTOCK_INTERNAL_ERROR, "非法数据访问接口")
	// }
	if (match = startKey.exec(s)){
		op = match[0];
		let s1 = s.substring(op.length)
		let match1 = opReg.exec(s1);
		if (match1){
			condition = match1[0];
			table = s1.substring(0, match1.index)
			let endIndex = match1.index + condition.length;
			if (endIndex < s1.length -1){
				cdtStr = s1.substr(endIndex, s1.length)
			}
		}
		else {
			table = s1
		}
		table = table.substr(0,1).toLowerCase() + table.substring(1, table.length)
	}
	else {
		if (s.split(' ') < 2){
			throw new EStockException(ErrCode.ERRCODE_ESTOCK_INTERNAL_ERROR, "非法数据访问接口")
		}
		else {
			return []
		}
	}
	let parseList = [op, table, condition, cdtStr];

	return parseList;
}



function buildWhereString(q) {
	let ent = Object.entries(), setQ=[];
	if (ent.length > 0){
		for (let [key, val] of ent){
			setQ.push(key + '=' + val)
		}
		return setQ.join(',')
	}
	return ''

}

/**
 * sql 解释
 * @param db
 * @param tb
 * @param sql
 * @param q
 * @param tableId
 * @returns {Promise.<{key: *, value: {}}>}
 */
export async function runMongo(db,tb, sql,q, option) {
	try {
		let query, key = tb, result = {}, rst;
		switch (sql){
			case "getTotalList":
				result = await getTotalList(db, tb, q, option)
				break;
			case "add":
				rst = await add(db, tb, q, option)
				result = rst;
				break;
			case "count":
				result = await count(db, tb, q, option)
				break;
			case "get":
				rst = await get(db, tb, q, option)
				result = rst;
				break;
			case "delete":
				rst = await del(db, tb, q, option)
				break;
			case "update":
				result = await update(db, tb, q, option)
				break;
			case "getList":
				if (tb){
					key = tb + "List"
				}
				else if (option.model){
					key = option.model + "List"
				}
				rst = await page(db, tb, q, option);
				result[key] = rst[0];
				result.total = rst[1];
				break;
			default:
				break;
		}

		return result;
	}
	catch (e){
		logger.error(e);
		throw e;
	}
}

export async function bulkWrite(db,tb,q, option) {
	let connection = await getMongoConnection(db);
	let model = connection.collection(tb).bulkWrite(q);
	return await model;
}
async function getTotalList(db,tb,q, option) {
	let connection = await getMongoConnection(db);
	// 用key map的形式，由于参数更多时候是省略的，减少更多的循环
	let col = connection.collection(tb), model;
	q= q || {};
	let opKeyMap = {'orderBy':1,'order':1}, where={};

	for (let qkey in q){
		if (!opKeyMap.hasOwnProperty(qkey)){
			where[qkey] = q[qkey]
		}
	}
	model = col.find(where)
	if (option && option.field){
		model = col.find(where, option.field)
	}
	if (q.orderBy){
		let orderOpt = {}
		orderOpt[q.orderBy] = 1;
		if (q.order == 'desc'){
			orderOpt[q.orderBy] = -1;
		}
		model = model.sort(orderOpt)
	}
	let rstListPromist = model.toArray();
	let rst = await rstListPromist;
	return rst;
}


async function page(db,tb,q, option) {
	let connection = await getMongoConnection(db);
	// 用key map的形式，由于参数更多时候是省略的，减少更多的循环
	let opKeyMap = {'orderBy':1,'order':1,'pageSize':1,'pageNo':1}, where={};
	for (let qkey in q){
		if (!opKeyMap.hasOwnProperty(qkey)){
			where[qkey] = q[qkey]
		}
	}

	let col = connection.collection(tb), model;
	model = col.find(where)
	if (option && option.field){
		model = col.find(where, option.field)
	}
	let totalPromise = model.count();
	if (q.orderBy){
		let orderOpt = {}
		orderOpt[q.orderBy] = 1;
		if (q.order == 'desc'){
			orderOpt[q.orderBy] = -1;
		}
		model = model.sort(orderOpt)
	}
	if (q.pageSize){
		model = model.limit(parseFloat(q.pageSize))
	}
	if (q.pageNo){
		model = model.skip((q.pageNo-1) * q.pageSize)
	}
	let rstListPromist = model.toArray();
	return await Promise.all([rstListPromist, totalPromise]);
}

async function get(db,tb,q, option) {
	let connection = await getMongoConnection(db);
	// 用key map的形式，由于参数更多时候是省略的，减少更多的循环
	let model = connection.collection(tb).findOne(q);
	return await model;
}
async function del(db,tb,q, option) {
	let connection = await getMongoConnection(db);
	// 用key map的形式，由于参数更多时候是省略的，减少更多的循环
	let model = connection.collection(tb).remove(q);
	return await model;
}

async function add(db, tb, item, option) {
	let connection = await getMongoConnection(db);
	let idname = tb + 'Id';
	if (!item.hasOwnProperty(idname)){
		if (option && option.idSet == 0){
			let col = connection.collection(tb);
			let rst = await col.insertOne(item);
			if (rst.ok){
				return item;
			}
			else {
				return rst.toJSON();
			}
		}
		let addPlist = [];
		let idMod = connection.collection('ids');
		let idMsg = await idMod.findOne({'name':tb});
		let itemId = 0;
		if (idMsg && idMsg.hasOwnProperty('id')){
			if (idMsg['id'] instanceof  Long){
				itemId = idMsg['id'].add(new Long(1));
			}
			else if (typeof(idMsg['id']) == 'number'){
				itemId = idMsg['id'] + 1
			}
		}
		if (itemId == 0){
			throw new EStockException(ErrCode.ERRCODE_ESTOCK_INTERNAL_ERROR, '查询id错误')
		}
		item[idname] = itemId;
		addPlist.push(idMod.updateOne({name:tb}, {$set:{id:itemId}}));
		let col = connection.collection(tb);
		addPlist.push(col.insertOne(item));
		let rst = await Promise.all(addPlist);
		if  (rst[1] && rst[1].result && rst[1].result.ok){
			return item;
		}
		else {
			return rst[1];
		}
	}
	else {
		let col = connection.collection(tb);
		let rst = await col.insertOne(item);
		if (rst.ok){
			return item;
		}
		else {
			return rst.toJSON();
		}
	}

}

async function update(db, tb, item, option) {
	let connection = await getMongoConnection(db);
	let col = connection.collection(tb);
	let idname = tb + 'Id', colid , updateCondi = {};
	if (isNaN(item[idname])){
		throw new EStockException(ErrCode.ERRCODE_ESTOCK_REQ_PARAM, '缺少id', 1)
	}
	else {
		colid = Number(item[idname]) ;
		delete item[idname]
	}
	updateCondi[idname] = colid;
	let rst = await col.updateOne(updateCondi, {$set:item}, {
		upsert: true
	});
	if  (rst.result.ok){
		return item;
	}
	else {
		return rst;
	}

}


async function count(db, tb, q) {
	let connection = await getMongoConnection(db);
	let opKeyMap = {'orderBy':1,'order':1,'pageSize':1,'pageNo':1}, where={};
	for (let qkey in q){
		if (!opKeyMap.hasOwnProperty(qkey)){
			where[qkey] = q[qkey]
		}
	}
	return await connection.collection(tb).find(where).count();
}
