import * as requestUtil from 'frontCommon/util/requestUtil'
import * as LoggerFactory from 'frontCommon/util/loggerFactory'
import fs from 'fs'
import util from "util"
import DefaultParam from './defaultParam'
import * as DB from './db'
import * as mongoClient from './mongoClient'
import extend from "node.extend"
import Config from 'frontCommon/config'
import {createContext} from './context'
import {getGlobalTaskAttribute} from './globalTaskAttr'
import {getBusinessModule} from '../business/module'


import {EStockException, ErrCode} from 'frontCommon/exception/estockException'

const logger = LoggerFactory.getLogger('esfront/framework/workflow')
let moduleCfg = {}
let apiHost = Config.api
for (let m in apiHost){
	moduleCfg[m] = {HOST:apiHost[m]}
}

async function doHttpRequest(task, ctx) {
	let uri = task.target;
	if (uri.substr(0,1)=="/"){
		let parseArray = uri.split("/");
		let moduleStr = parseArray[1]
		if (moduleCfg.hasOwnProperty(moduleStr)){
			let module = moduleCfg[moduleStr];
			if (module.hasOwnProperty("HOST")){
				uri = module['HOST'] + uri;
			}
		}
		else {
			uri = 'http://127.0.0.1'+ uri;
		}
	}
	let reqRst = {}
	// try{
	if (task.method == "post"){
		reqRst = await requestUtil.submitService(uri,task.reqParam, ctx);
	}
	else {
		reqRst = await requestUtil.accessService(uri,task.reqParam, ctx);
	}
	return reqRst;
}

function setTaskParam(ctx, task) {
	let dependence_params = task.param;
	let reqJson = ctx.reqJson, params={}, pKey="";
	if (dependence_params.length){
		for(let i = 0; i < dependence_params.length;i++){
			try{
				pKey = dependence_params[i];
				if (util.isObject(pKey)){
					let k = Object.keys(pKey)[0], v = pKey[k];
					if (util.isString(v) && v.substr(0, 6) == "param."){
						params[k] = ctx.state.param[v.substr(6, v.length)]
					}
					else if (v.hasOwnProperty('required')){
						if (v.required){
							if (reqJson.hasOwnProperty(k)){
								params[k] = reqJson[k];
							}
							else {
								throw new EStockException(ErrCode.ERRCODE_ESTOCK_REQ_PARAM, '缺少参数'+k, 1);
							}
						}
						else{
							if (reqJson.hasOwnProperty(k)){
								params[k] = reqJson[k];
							}
						}
					}
					else {
						extend(params, pKey)
					}
					continue;
				}
				if (DefaultParam.hasOwnProperty(pKey)){
					params[pKey] = DefaultParam[pKey]
				}
				// 修改了优先级记得看一下
				if (ctx.state.param.hasOwnProperty(pKey)){
					params[pKey]= ctx.state.param[pKey];
				}
				else if (reqJson.hasOwnProperty(pKey)){
					params[pKey]= reqJson[pKey];
				}

			}
			catch (e){
				if (e instanceof EStockException){
					throw e;
				}
				logger.error('param key',pKey, e.stack)
			}
		}
	}
	else if (Object.keys(dependence_params)){
		params = Object.assign({},dependence_params)
	}

	return params;
}

function fillTaskParam(ctx, task) {
	let reqParam = {}, gblParam = ctx.state.gblParam;
	if (task.param){
		if (task.hasOwnProperty('shareParam') && task.shareParam){
			task.reqParam = extend(true, gblParam, setTaskParam(ctx, task))
		}
		else {
			task.reqParam = extend(reqParam, setTaskParam(ctx, task));
		}
	}
}

async function intepretDom(ctx, task) {
	task = extend( getGlobalTaskAttribute(2), task );
	if ((typeof task=='string')&&task.constructor== String){
		return await doHttpRequest(task, ctx)
	}
	else if (task.target){
		if (task.target.substr(0, 1) == "/" ){
			let ret = {}
			if (task.method == "post"){
				ret = await doHttpRequest(task, ctx)
			}
			else {
				ret = await doHttpRequest(task, ctx);
			}
			return ret;
		}

	}
}

function constructDefaultResult(ctx, svcList) {
	for (let i = 0; i < svcList.length; i++) {
		let task = svcList[i];
		if (util.isString(task.key) && task.key.length > 0) {
			let rstKey = task.key;
			if (rstKey.indexOf("List") > -1){
				ctx.state.result[rstKey] = [];
			}
			else if (rstKey.toLowerCase().indexOf("total") > -1){
				ctx.state.result[rstKey] = 0;
			}
			else if (rstKey !== "$0"){
				ctx.state.result[rstKey] = {}
			}
		}
		if (util.isArray(task)){
			constructDefaultResult(ctx, task);
		}

		if (util.isArray(task.parallelList)){
			constructDefaultResult(ctx, task.parallelList)
		}
	}

}

function verifyVersion(version, taskVersion) {
	let mainV = 0, subV = 0;
	if (version && version.length > 0) {
		let version_list = version.split(".");
		if (version_list.length > 0) {
			if (!isNaN(version_list[0])) {
				mainV = parseInt(version_list[0])
			}
			if (version_list.length > 1) {
				if (!isNaN(version_list[1])) {
					subV = parseInt(version_list[1])
				}

			}
		}
	}
	else {
		return false;
	}
	let clientV = mainV + '.' + subV
	if (isNaN(taskVersion)){
		let digitIndex = taskVersion.search(/\d/);
		let taskVersionSign = taskVersion.substr(0,digitIndex);
		taskVersion = taskVersion.substr(digitIndex, taskVersion.length);
		switch (taskVersionSign){
			case "<":
				if (clientV < taskVersion){
					return true;
				}
				break;
			case ">":
				if (clientV >= taskVersion){
					return true;
				}
				break;
			case "<=":
				if (clientV <= taskVersion){
					return true;
				}
				break;
			case ">=":
				if (clientV >= taskVersion){
					return true;
				}
				break;
			case "=":
				if (clientV = taskVersion){
					return true;
				}
				break;
			default:
				return false;
		}
	}
	else {
		if (clientV >= taskVersion){
			return true;
		}
		else {
			return false;
		}
	}
}

function setResult(ctx, task, reqRst) {
	if (task.requestResult){
		ctx.state.requestResult[task.requestResult] = reqRst;
	}
	else if (task.target){
		ctx.state.requestResult[task.target] = reqRst;
	}
	if (task.toParam){
		ctx.state.param[task.toParam] = reqRst;
	}
	if (task.key){
		if (task.key == "$0"){
			extend(ctx.state.result, reqRst);
		}
		else {
			ctx.state.result[task.key] = reqRst;
		}
	}
}

async function dealSingleTask(ctx, task) {
	let middleware = task.handler, next, hasHandler = util.isFunction(task.handler);
	try{
		if (task.target){
			next = async function () {
				try{
					fillTaskParam(ctx, task)
					if (arguments.length > 0){
						if (util.isObject(arguments[0]) ){
							task.reqParam = {...task.reqParam, ...arguments[0]}
						}
					}
					let reqRst = await intepretDom(ctx, task);
					setResult(ctx, task, reqRst);
					return reqRst;
				}
				catch (e){
					throw e;
				}
			}
		}
		if (task.mysql) {
			next = async function () {
				fillTaskParam(ctx, task)
				if (arguments.length > 0){
					if (util.isObject(arguments[0]) ){
						task.reqParam = {...task.reqParam, ...arguments[0]}
					}
				}

				let reqRst = await fastSql(ctx, task);
				setResult(ctx, task, reqRst);
				return reqRst;
			}
		}
		if (task.mongo){
			next = async function () {
				fillTaskParam(ctx, task)
				if (arguments.length > 0){
					if (util.isObject(arguments[0]) ){
						task.reqParam = {...task.reqParam, ...arguments[0]}
					}
				}
				let reqRst = await mongoSql(ctx, task);
				setResult(ctx, task, reqRst);
				return reqRst;
			}
		}
		if (hasHandler){
			return await middleware(ctx, next);
		}
		else if(next){
			return await next();
		}
		if (util.isFunction(task)){
			return await task(ctx, ctx.state.requestResult);
		}
	}
	catch (e){
		logger.error(e);
		if (e instanceof EStockException){
			logger.error(e.toString());
			if(e.type == 1 || task.plugins === "EStockException"){
				delete e.url;
				delete e.type;
				throw e;
			}
		}
		if (task.requestResult){
			ctx.state.requestResult[task.requestResult] = {};
		}
		if (task.key){
			if (task.key != "$0"){
				ctx.state.result[task.key] = {};
			}
		}
	}
}

async function dealArrayTask(ctx, task) {
	if (util.isArray(task)){
		for (let i = 0;i < task.length;i ++) {
			let t = task[i];
			if (t.version && ctx.reqJson.v ){
				if (!(verifyVersion(ctx.reqJson.v, t.version))){
					continue;
				}
			}
			await intepretTask(ctx, t);
		}
	}
	else {
		let p = task.param;
		let taskList = task.serial || task.taskList;
		for (let i = 0;i < taskList.length;i ++) {
			let t = taskList[i];
			if (t.version && ctx.reqJson.v ){
				if (!(verifyVersion(ctx.reqJson.v, t.version))){
					continue;
				}
			}
			if (t.param && t.param.length > 0){
				if (p && p.length > 0){
					t.param = t.param.concat(p)
				}
			}
			else if (t.param){
			}
			else {
				t.param = p
			}
			await intepretTask(ctx, t);
		}
	}

}

async function intepretTask(ctx, task) {
	ctx.currentTask = task;
	let next = null;
	if (ctx.state.breakRequest){
		return {};
	}
	if (util.isArray(task)){
		await dealArrayTask(ctx, task)
		return
	}

	// 分支条件
	if (task.if){
		if (util.isString(task.if)){
			let taskCondiction = conditionAssemble(task.if, ctx);
			if (!taskCondiction){
				return {};
			}
		}
	}
	// 串行子任务
	if (task.subtask || task.serial){
		let subtask = task.serial || task.subtask;
		return await dealArrayTask(ctx, subtask)
	}
	else if (task.plugin){
		next = async function () {
			if (util.isObject(arguments[0]) ){
				task.reqParam = arguments[0];
			}
			let plugin;
			try{
				plugin = require('../plugin/'+ task.plugin).default;
			}
			catch (e){
				logger.error("plugin module", task.plugin, "not exist");
				throw new EStockException(ErrCode.ERRCODE_ESTOCK_INTERNAL_ERROR,"找不到模块")
			}
			if (plugin){
				if (util.isFunction(plugin)){
					return await plugin(task)
				}
				else if (task.param){
					plugin.param = task.param;
					return await intepretTask(ctx, plugin)
				}
			}
		}
		if (task.handler){
			task.handler(ctx, next)
		}
		else {
			return await next();
		}
	}
	else if (task.module){
		task.reqParam = {};
		let moduleParam = {};
		if (task.param){
			moduleParam = setTaskParam(ctx, task)
		}
		else {
			moduleParam = ctx.reqJson;
		}
		let moduleFunc = getBusinessModule(task.module, moduleParam, task);
		delete moduleFunc.module;
		let ret = '';
		if (util.isFunction(task.handler)){
			let next1 = async function () {
				if (util.isObject(arguments[0]) ){
					task.reqParam = arguments[0];
				}
				let rst = await intepretTask(ctx, moduleFunc);
				setResult(ctx, task, rst)
				return rst;
			}
			ret = await task.handler(ctx, next1);
		}
		else {
			ret = await dealArrayTask(ctx, moduleFunc)
			setResult(ctx, task, ret)
		}
		return ret;

	}
	else if (util.isArray(task.parallelList)){
		task.reqParam = {};
		if (task.param){
			extend(ctx.param, setTaskParam(ctx, task));
		}
		if (util.isFunction(task.handler)){
			let f1 = async function () {
				if (util.isObject(arguments[0]) ){
					task.reqParam = arguments[0];
				}
				let plist = [];
				for (let i = 0;i < task.parallelList.length;i++){
					plist.push(
						new Promise(async (resolve, reject) => {
								try{
									resolve( await intepretTask(ctx, task.parallelList[i]))
								}
								catch (e){
									if (task.parallelList[i].defaultResult){
										resolve(task.parallelList[i].defaultResult)
									}
									else {
										resolve({})
									}
								}
							}
						)
					)
				}
				return await Promise.all(plist);
			}
			await task.handler(ctx, f1);
		}
		else {
			let plist = [];
			for (let i = 0;i < task.parallelList.length;i++){
				plist.push(
					new Promise(async (resolve, reject) => {
							try{
								resolve( await intepretTask(ctx, task.parallelList[i]))
							}
							catch (e){
								resolve({})
							}
						}
					)
				)
			}
			await Promise.all(plist);
		}
		return {}
	}
	else if (task.repeat){
		// 实验性功能，任务的复制待测试

		if (!isNaN(task.repeat)){
			let plist = [];
			for (let i = 0;i < task.repeat;i++){
				let subTask = {...task};
				let taskParam = task.repeatParam;
				if (taskParam){
					subTask.reqParam = Object.assign({}, taskParam);
				}
				plist.push(dealSingleTask(ctx, subTask))
			}
			return await Promise.all(plist);
		}
		else if (util.isFunction(task.repeat)){
			let repeatFunc = async function () {
				try{
					let plist = [];
					for (let taskParam of task.repeatParam){
						let subTask = {...task};
						subTask.reqParam = Object.assign({}, taskParam);
						plist.push(
							new Promise(async (resolve, reject) => {
									try{
										resolve( await dealSingleTask(ctx, subTask))
									}
									catch (e){
										resolve({})
									}
								}
							))
					}
					return await Promise.all(plist);
				}
				catch (e){
					logger.error(e)
				}
			}
			return await task.repeat(ctx, repeatFunc)
		}
	}
	// try catch统一处理报错，中间不能再加try catch
	task.reqParam = {};
	return await dealSingleTask(ctx, task)

}

function assemble(literal, params) {
	try{
		let p = new Function(params, "return `"+literal+"`;"); // TODO: Proper escaping
		return p
	}
	catch (e){
		logger.error(e.stack);
	}
}

function conditionAssemble(fn, ctx) {
	try {
		return new Function('ctx','return ' + fn)(ctx);
	}
	catch (e){
		logger.error(e.stack);
		throw e;
	}
}

export async function fastSql(ctx, task) {
	task = extend( getGlobalTaskAttribute(2), task );
	let db = Config.db.defaultDb, rst;
	if (task.db){
		db = task.db;
	}
	if (task.mysql){

		let table = task.table;
		let parseTg = DB.parseDbTarget(task.mysql);
		// parseTg = [operation, table, condition ]
		if (parseTg.length > 0){
			if (!table){
				table = parseTg[1];
			}
			if (task.model){
				if (!task.option){
					task.option = {}
				}
				task.option.model = task.model;
			}
			rst = await DB.runMysql(db, table, parseTg[0]+parseTg[2], task.reqParam, task.tableId, task.option);
		}
		else {
			try{
				let mysqlFunc = assemble(task.mysql, 'ctx');
				let sqlstr = mysqlFunc(ctx);
				logger.info('------raw sql---', sqlstr);
				rst = await DB.runMysql(db, parseTg[1], sqlstr, task.reqParam, task.tableId);
			}
			catch (e){
				logger.error(e.stack);
			}
		}
	}

	return rst;
}

export async function mongoSql(ctx, task) {
	task = extend( getGlobalTaskAttribute(2), task );
	let db = Config.db.defaultDb, rst;
	if (task.db){
		db = task.db;
	}
	let collection = task.collection;
	let parseTg = DB.parseDbTarget(task.mongo);
	// parseTg = [operation, table, condition ]
	if (parseTg.length > 0){
		if (!collection){
			collection = parseTg[1];
		}
		if (task.model){
			if (!task.option){
				task.option = {}
			}
			task.option.model = task.model;
		}

		rst = await mongoClient.runMongo(db, collection, parseTg[0]+parseTg[2], task.reqParam, task.option);
		return rst;
	}

}

async function directDataApi(ctx, task) {
	let path = ctx.path;
	let pathArr = path.split('/');
	if (pathArr.length > 2){
		let realPath = pathArr[2];
		let db = Config.db.defaultDb;
		let taskAttr = ctx.taskAttr;
		if (taskAttr && taskAttr.db){
			db = taskAttr.db;
		}
		let [op, table, condition] = DB.parseDbTarget(realPath);
		if (op == 'add' || op == 'update'){
			if (Object.keys(ctx.clientParam).length < 1){
				throw EStockException(ErrCode.ERRCODE_ESTOCK_REQ_PARAM, '错误的参数')
			}
		}
		let rst = await DB.runMysql(db, table, op+condition, ctx.clientParam, taskAttr.tableId);
		ctx.state.result = rst;
	}
	else {
		throw EStockException(ErrCode.ERRCODE_ESTOCK_INTERNAL_ERROR, '非法数据接口')
	}
}


export function handleService(task) {
	return async function (ctx) {
		let taskCfg = task.default;
		if (!taskCfg){
			taskCfg = task;
		}
		ctx.esFrontCtx = createContext(ctx);
		ctx.state.pluginVar = {};
		ctx.state.task = taskCfg;
		ctx.state.gblParam = {};
		ctx.esFrontCtx.reqJson = ctx.reqJson;
		if (task.attr){
			let attr = task.attr, apiType=attr.type;

			ctx.taskAttr = attr;
			if (attr.param){
				ctx.state.gblParam = setTaskParam(ctx, attr);
			}
			switch (apiType){
				case 2:
					await directDataApi(ctx, task)
					break;
				default:
					if (util.isFunction(taskCfg)){
						let taskF = taskCfg(ctx)
						constructDefaultResult(ctx, taskF);
						await intepretTask(ctx, taskF);
					}
					else {
						await intepretTask(ctx, taskCfg);
					}
					break;
			}

		}
		else {
			ctx.taskAttr = {};
			if (util.isFunction(taskCfg)){
				let taskF = taskCfg(ctx)
				constructDefaultResult(ctx, taskF);
				await intepretTask(ctx, taskF);
			}
			else {
				await intepretTask(ctx, taskCfg);
			}
		}


	}
}