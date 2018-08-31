/**
 * Created by sky on 2017/9/2.
 */

let sqlAttr = {
};
let reqAttr ={
}


/**
 * 获取任务共同属性
 * @param taskType: 1: 普通http请求, 2: sql请求
 */
export function getGlobalTaskAttribute(taskType) {
    let taskAttr;
    switch (taskType){
        case 1:
            taskAttr = Object.create(reqAttr);
            break;
        case 2:
            taskAttr = Object.create(sqlAttr);
            break;
        default:
            taskAttr = {};
            break;
    }
    return taskAttr;

}