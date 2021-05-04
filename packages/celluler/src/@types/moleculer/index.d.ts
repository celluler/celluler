/* eslint-disable import/prefer-default-export */
/* eslint-disable no-unused-vars */
import 'moleculer'

declare module 'moleculer' {
  export type Utils = {
    isFunction(fn: any): boolean
    isString(s: any): boolean
    isObject(o: any): boolean
    isPlainObject(o: any): boolean
    isDate(d: any): boolean
    fallten(arr: any[]): []
    dotSet(o: any, path: string, value: any): any
    getNodeID(): string
  }

  interface Context {
    myfield: string
  }
}
