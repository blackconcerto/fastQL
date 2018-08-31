import util from "util"
import * as LoggerFactory from 'frontCommon/util/loggerFactory'
import DefaultParam from '../framework/defaultParam'
import extend from "node.extend"


const logger = LoggerFactory.getLogger('esFront/framework/utils')

export  function getRequestResult(ctx,key) {
    return ctx.state.requestResult[key];
}

export  function setResult(ctx, key, val) {
    ctx.state.result[key] = val;
}

export  function getResult(ctx, key) {
    return ctx.state.result[key];
}

export function setParam(ctx, key, val) {
    ctx.param[key]=val
}

export function getParam(ctx, key) {
    return ctx.param[key];
}
export function setTemp(ctx, key, val) {
    ctx.state.temp[key]=val
}

export function getTemp(ctx, key) {
    return ctx.state.temp[key];
}

export function getClientParam(ctx, key) {
    if (key === undefined){
        return ctx.reqJson;
    }
    else if (ctx.reqJson && ctx.reqJson.hasOwnProperty(key)){
        return ctx.reqJson[key];
    }
    return DefaultParam[key];
}

export function filterColumnDict(dict,onlyKeys, dictKeys){
    let newDict = {};
    if (dictKeys && dictKeys.length == onlyKeys.length){
        for(let i=0;i< onlyKeys.length; i++){
            let key1 = onlyKeys[i], key2 = dictKeys[i];
            newDict[ key1 ] = dict[ key2 ];
        }
    }
    else {
        for(let i=0;i< onlyKeys.length; i++){
            let key = onlyKeys[i];
            newDict[ key ] = dict[ key ];
        }
    }

    return newDict;
}
export function filterColumnList(list,onlyKeys, dictKeys){
    let newList = [];
    for(let i=0;i< list.length; i++){
        newList.push( filterColumnDict( list[i],onlyKeys,dictKeys) );
    }
    return newList;
}
export function listFilterItem(list,filterItem){
    let newlist =[];
    for(let i=0;i< list.length;i++){
        let item = list[i];
        if( item.hasOwnProperty(filterItem) ){
            newlist.push( item );
        }
    }
    return newlist;
}
export function listFilterSubItem(list,filterItem){
    let newlist =[];
    for(let i=0;i< list.length;i++){
        let item = list[i];
        if( item.hasOwnProperty(filterItem) ){
            newlist.push( item[filterItem] );
        }
    }
    return newlist;
}

export function listAddSubItem(list, dict, cmpKey, addKey) {
    if (!util.isArray(list)){
        return;
    }
    for (let i = 0;i < list.length;i++){
        let cmpVal = list[i][cmpKey];
        if (dict.hasOwnProperty(cmpVal)){
            list[i][addKey] = dict[cmpVal]
        }
    }
}

export function listConstructFieldMapping(list, field1, field2, defaultVal) {
    if (!util.isArray(list)){
        return;
    }
    let map = {};
    if (defaultVal !== undefined){
        for (let i = 0;i < list.length;i++){
            map[list[i][field1]] = list[i][field2] || defaultVal;
        }
    }
    else {
        for (let i = 0;i < list.length;i++){
            map[list[i][field1]] = list[i][field2];
        }
    }
    return map;

}

export function listConstructFieldItemMapping(list, fieldKey, ...fields) {
    if (!util.isArray(list)){
        return;
    }
    let map = {};
    for (let i = 0;i < list.length;i++){
        let item = list[i], fieldItem = {};
        for (let fd of fields){
            fieldItem[fd] = item[fd]
        }
        map [ item[fieldKey]] = fieldItem;
    }
    return map;
}
/**
 * 遍历list，找对应dict中cmpkey相同的元素，将该元素的addKey的值设置到list中
 * @param list
 * @param dict
 * @param cmpKey
 * @param addKey
 */
export function listAddfield(list, dict, cmpKey, addKey) {
    if (!util.isArray(list)){
        return;
    }
    for (let i = 0;i < list.length;i++){
        let cmpVal = list[i][cmpKey];
        if (dict.hasOwnProperty(cmpVal)){
            list[i][addKey] = dict[cmpVal][addKey]
        }
    }
}

export function listAddSubList(list, dict, cmpKey, addKey) {
    for (let i = 0;i < list.length;i++){
        let cmpList = list[i][cmpKey], subList = [];
        for (var j = 0;j < cmpList.length;j++){
            let cmpVal = cmpList[j];
            if (dict.hasOwnProperty(cmpVal)){
                list[i][addKey] = dict[cmpVal]
            }
        }
        list[i][addKey] = subList;
    }
}

export function listAddSubListByIndefiniteKey(list, dict, func1, addKey) {
    for (let i = 0;i < list.length;i++){
        let item = list[i]
        let cmpList = func1(item), subList = [];
        for (let j = 0;j < cmpList.length;j++){
            let cmpVal = cmpList[j];
            if (dict.hasOwnProperty(cmpVal)){
                subList.push(dict[cmpVal])
            }
        }
        list[i][addKey] = subList;
    }
}

export function listToDict(list,keyItem){
    let dict = {};
    for (let i = 0;i < list.length;i++){
        let item = list[i];
        let key = item[ keyItem ];
        dict[ key ] = item;
    }
    return dict;
}

export function listSortAndPage(list, sortKey, order, pageNo, pageSize) {
    if(order > 0){
        list.sort(function(a,b){
            return parseFloat(b[sortKey]) - parseFloat(a[sortKey]);
        });
    }
    if(order < 0){
        list.sort(function(a,b){
            return parseFloat(a[sortKey]) - parseFloat(b[sortKey]);
        });
    }
    let start = pageSize * (pageNo - 1);
    let end = pageSize * pageNo;
    return list.slice(start,end);
}


export function dictAddSubDict(dict,addDict,cmpItem,addKey){
    let keys = Object.keys(dict);
    let addKeys = Object.keys( addDict );
    for( let i=0;i< keys.length;i++ ){
        let key = keys[i];
        for( let j=0;j< addKeys.length; j++){
            let addKey = addKeys[i];
            if( dict[key] == addDict[ addKey ]){
                dict[key][ addKey ] = addDict[ addKey ];
                break;
            }
        }
    }
    return dict;
}

export function listExtendSubDict(l, dict, cmpKey) {
    for (let item of l){
        if (dict[item[cmpKey]]){
            extend(item, dict[cmpKey])
        }
    }
}

/**
 * 寻找toAddList中toAddKey值与distList中distKey值相同的子元素，并将对应toAddList的子元素添加到distList中
 * 添加的到distList的子元素的key为addedKey
 * @param distList, 添加目标列表
 * @param toAddList,
 * @param mappingKey
 */
export function mergeMappingList(toAddList, toAddKey, distList,distKey, addedKey) {
    if (!util.isArray(toAddList) || !util.isArray(distList)){
        return;
    }
    let mapping = listToDict(toAddList, toAddKey);
    for (let i = 0;i < distList.length;i++){
        let item = distList[i];
        if (mapping.hasOwnProperty(item[distKey])){
            item[addedKey] = mapping[item[distKey]]
        }
        else {
            item[addedKey] = {}
        }
    }
}


/**
 * 顺序遍历数组，取前边key值比val大的子数组
 * 添加的到distList的子元素的key为addKey
 * @param l, 需要截取的数组
 * @param key, 对比的元素key
 * @param val, 对比的值
 */
export function subListByGtKey(l, key, val) {
    if (!util.isArray(l)){
        return;
    }
    let l1 = [];
    for (let i =0; i < l.length;i++){
        if (l[i].hasOwnProperty(key)){
            if (l[i][key] > val){
                l1.push(l[i]);
            }
            else {
                break;
            }
        }
    }
    return l1;
}

/**
 * 顺序遍历数组，取前边key值比val小的子数组
 * 添加的到distList的子元素的key为addKey
 * @param l, 需要截取的数组
 * @param key, 对比的元素key
 * @param val, 对比的值
 */
export function subListByLtKey(l, key, val) {
    if (!util.isArray(l)){
        return;
    }
    let l1 = [];
    for (let i =0; i < l.length;i++){
        if (l[i].hasOwnProperty(key)){
            if (l[i][key] < val){
                l1.push(l[i]);
            }
            else {
                break;
            }
        }
    }
    return l1;
}

/**
 * 倒遍历数组，取后边key值比val大的子数组
 * 添加的到distList的子元素的key为addKey
 * @param l, 需要截取的数组
 * @param key, 对比的元素key
 * @param val, 对比的值
 */
export function reverseSubListByGtKey(l, key, val) {
    if (!util.isArray(l)){
        return;
    }

    let l1 = [], l2 = [];
    for (let i =l.length-1; i > -1;i--){
        if (l[i].hasOwnProperty(key)){
            if (l[i][key] > val){
                l1.push(l[i]);
            }
            else {
                break;
            }
        }
    }
    for (let i = l1.length-1;i>-1;i--){
        l2.push(l1[i]);
    }
    return l2;
}

/**
 * 倒序遍历数组，取前边key值比val小的子数组
 * 添加的到distList的子元素的key为addKey
 * @param l, 需要截取的数组
 * @param key, 对比的元素key
 * @param val, 对比的值
 */
export function reverseSubListByLtKey(l, key, val) {
    if (!util.isArray(l)){
        return;
    }
    let l1 = [], l2= [];
    for (let i =l.length-1; i > -1;i--){
        if (l[i].hasOwnProperty(key)){
            if (l[i][key] < val){
                l1.push(l[i]);
            }
            else {
                break;
            }
        }
    }
    for (let i = l1.length-1;i>-1;i--){
        l2.push(l1[i]);
    }
    return l1;
}

/**
 * 列表排序,
 * @param list
 * @param key
 * @param dir, 排列顺序，lt正序，gt逆序
 * @returns {*}
 */
export function sort(list, key, dir) {
    if (dir == 'lt'){
        list.sort(function (a, b) {
            return a[key] - b[key]
        })
    }
    else if (dir == 'gt'){
        list.sort(function (a, b) {
            return b[key] - a[key];
        })
    }

    return list;
}


/**
 * 过滤唯一字段,
 * @param list
 * @param key
 * @param dir, 排列顺序，lt正序，gt逆序
 * @returns {*}
 */
export function filterUniqueList(list, key) {
    let filterDict = {};
    for (let i = 0;i<list.length;i++){
        filterDict[list[i][key]] = 1;
    }
    return Object.keys(filterDict);
}

/**
 * 列表排序,
 * @param list
 * @param key
 * @param dir, 排列顺序，lt正序，gt逆序
 * @returns {*}
 */
export function filterUniqueListByFunc(list, key, func) {
    let filterDict = {};
    for (let i = 0;i<list.length;i++){
        filterDict[list[key]] = 1;
    }
    return Object.keys(filterDict);
}