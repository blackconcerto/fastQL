import Config from 'frontCommon/config'
import * as LoggerFactory from 'frontCommon/util/loggerFactory'
import util from 'util'
import {EStockException, ErrCode} from 'frontCommon/exception/estockException'

import * as MysqlDB from 'frontCommon/database/mysqlDb'
const logger = LoggerFactory.getLogger('baseLibDB');

let  bookshelfs = {}, bookshelfsModels={};
const opKey = ['get', 'delete','update','add','List'], opReg=/(By|List)/, startKey=/^(count|get|delete|update|add)/;
const DBCfg = Config.db;

export function getBookshelfConnection(db) {
    if (bookshelfs[db]){
        return bookshelfs[db];
    }
    let cfgStr = db + 'Mysql';
    if (!DBCfg.hasOwnProperty(cfgStr)){
        logger.error(db, "have not config");
        return false;
    }
	bookshelfs[db] = MysqlDB.getBookshelfConnection(DBCfg[cfgStr]);
    return bookshelfs[db];
}

export function getModel(db, table, id, option) {
	let modelCfg = {};
    if (table.length < 1 && option.model){
        modelCfg = require('../business/model/'+option.model).default;
        table = modelCfg.table;
    }
    if (!id && modelCfg.tableId){
        id = modelCfg.tableId;
    }
    let tableId = db+'-'+table;
    if (bookshelfsModels.hasOwnProperty(tableId)){
        return bookshelfsModels[tableId];
    }
    else {
        if (!util.isString(id)){
            id = table+"Id";
        }
        // let knexClient = getKnexConnection(db);
        // if (knexClient){
        //     let tblist = knexClient.raw("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'adviser'")
        //     logger.debug('----------------', tblist);
        //     tbnameDict[id] = tblist;
        // }
        let jsonColumns = [];
        if (modelCfg.option && modelCfg.option.jsonColumns){
	        jsonColumns = modelCfg.option.jsonColumns;
        }
        let bookshelfCnt = getBookshelfConnection(db);
        bookshelfsModels[tableId] = bookshelfCnt.Model.extend({
            tableName:table,
            /**
             * 指定id字段，默认为"id"
             */
            idAttribute: id,
        },{
	        jsonColumns:jsonColumns
        });
        return bookshelfsModels[tableId]
    }

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
export async function runMysql(db,tb, sql,q, tableId, option) {
    if (!util.isString(tableId) && tb){
        tableId = tb+"Id";
    }
    try {
        let query, key = tb, result = {}, rst;
        switch (sql){
            case "getTotalList":
                rst = await getList(db, tb, q,tableId, option)
	            if (tb){
		            key = tb + "TotalList"
	            }
	            else if (option.model){
		            key = option.model + "TotalList"
	            }
                result[key] = rst.toJSON();
                break;
            case "get":
                rst = await get(db, tb, q,tableId, option)
                result = rst.toJSON();
                break;
            case "add":
                rst = await add(db, tb, q,tableId, option)
                result = rst.toJSON();
                break;
            case "count":
                result = await count(db, tb, q,tableId, option)
                break;
            case "delete":
                break;
            case "update":
                break;
            case "getList":
                if (tb){
	                key = tb + "List"
                }
                else if (option.model){
	                key = option.model + "List"
                }
                rst = await page(db, tb, q, tableId, option)
                result['total']=rst.pagination.rowCount;
                result[key] = rst.toJSON();
                break;
            default:
                rst = await raw(db,tb,sql, option)
                key = tb;
                result = rst;
                break;
        }

        return result;
    }
    catch (e){
        logger.error(e.stack);
        throw e;
    }
}

async function getList(db,tb,q, tableId, option) {
    let model = getModel(db,tb, tableId, option), where = q || {};
    return await MysqlDB.whereList(model, where);
}
async function get(db,tb, q,tableId, option){
    let id='';
    if (!tableId && q){
        let entries = Object.entries(q);
        [tableId, id] = entries[0]
    }
    else if (util.isString(q) || util.isNumber(q)){
        id = q;
    }
    let model = getModel(db,tb, tableId, option);
    return await MysqlDB.getItemById(model, id);
}
async function page(db,tb,q, tableId, option) {
    let model = getModel(db,tb, tableId, option);
    let sqlQ = {}
    // 用key map的形式，由于参数更多时候是省略的，减少更多的循环
    let opKeyMap = {'orderBy':1,'order':1,'pageSize':1,'pageNo':1}, where={};
    for (let qkey in q){
        if (!opKeyMap.hasOwnProperty(qkey)){
            where[qkey] = q[qkey]
        }
        else {
            sqlQ[qkey] = q[qkey]
        }
    }
    sqlQ.where = where;
    return await MysqlDB.getItemsPagination(model, sqlQ);
}

async function add(db, tb, item, tableId, option) {
    let model = getModel(db,tb, tableId, option);
    let saveObj = new model(item);
    return saveObj.save()
}

async function count(db, tb, q, tableId, option) {
    let model = getModel(db,tb, tableId, option);
    return await  MysqlDB.count(model, q);
}

async function raw(db, tb, q) {
    let dbCnn = getBookshelfConnection(db)
    let result = await dbCnn.knex.raw(q)
        .catch(function (error) {
            logger.error('sql error',db, q,error)
        })
	if (q.startsWith('select')){
        let str = JSON.stringify(result[0]);
        result = JSON.parse(str);
        return result;
    }
    if (q.includes(''))
        return result
}