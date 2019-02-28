/**
 * name:排序管道
 * describe:将数组排序后返回
 * author:赵展展
 * QQ:799316652
 * Email:zhanzhan.zhao@mirrortech.cn
 */
import { Pipe, PipeTransform } from "@angular/core";
import _ from "underscore"; // 工具类

@Pipe({
  name: "orderBy",
  pure: false
})
export class OrderByPipe implements PipeTransform {
  constructor() {}
  /**
   * 数组排序管道
   * @param {Array<any>} listArr 原始数组
   * @param {boolean} isReverse 是否反转
   * @param {string} [key] 对象数组排序关键字
   * @memberof OrderByPipe
   */
  transform(listArr: Array<any>, isReverse: boolean, key?: string) {
    if (_.isArray(listArr) && listArr.length == 0) {
      return listArr;
    } else if (_.isArray(listArr) && listArr.length > 0) {
      // 是数组并且有值
      const firstVal = listArr[0];
      if (_.isObject(firstVal) && !_.isEmpty(firstVal)) {
        // 对象数组并且有值
        if (_.isString(key) && key.length > 0) {
          // 有键
          const newListArr = _.sortBy(listArr, key);
          if (isReverse) {
            // 反转
            newListArr.reverse();
            return newListArr;
          } else {
            // 不反转
            return newListArr;
          }
        } else {
          // 无键
          if (isReverse) {
            // 反转
            listArr.reverse();
            return listArr;
          } else {
            // 不反转
            return listArr;
          }
        }
      } else if (_.isObject(firstVal) && _.isEmpty(firstVal)) {
        // 对象数组并且是空对象
        if (isReverse) {
          // 反转
          listArr.reverse();
          return listArr;
        } else {
          // 不反转
          return listArr;
        }
      } else {
        // 非对象数组
        const newListArr = _.sortBy(listArr, val => {
          return val;
        });
        if (isReverse) {
          // 反转
          newListArr.reverse();
          return newListArr;
        } else {
          // 不反转
          return newListArr;
        }
      }
    }
  }
}
