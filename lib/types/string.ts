'use strict';

import ValidationError from '../error/validation';
import SchemaType from '../schematype';

/**
 * String schema type.
 */
class SchemaTypeString extends SchemaType {

  /**
   * Casts a string.
   *
   * @param {*} value
   * @param {Object} data
   * @return {String}
   */
  cast(value_:any, data:any):string {
    const value = super.cast(value_, data);

    if (value == null || typeof value === 'string') return value;
    if (typeof value.toString === 'function')return value.toString();
  }

  /**
   * Validates a string.
   *
   * @param {*} value
   * @param {Object} data
   * @return {String|Error}
   */
  validate(value_: any, data: any):string|Error {
    const value = super.validate(value_, data);

    if (value !== undefined && typeof value !== 'string') {
      throw new ValidationError(`\`${value}\` is not a string!`);
    }

    return value;
  }

  /**
   * Checks the equality of data.
   *
   * @param {*} value
   * @param {String|RegExp} query
   * @param {Object} data
   * @return {Boolean}
   */
  match(value, query, data) {
    if (!value || !query) {
      return value === query;
    }

    if (typeof query.test === 'function') {
      return query.test(value);
    }

    return value === query;
  }

  /**
   * Checks whether a string is equal to one of elements in `query`.
   *
   * @param {String} value
   * @param {Array} query
   * @param {Object} data
   * @return {Boolean}
   */
  q$in(value:string, query:any, data:any):boolean {
    for (let i = 0, len = query.length; i < len; i++) {
      if (this.match(value, query[i], data)) return true;
    }

    return false;
  }

  /**
   * Checks whether a string is not equal to any elements in `query`.
   *
   * @param {String} value
   * @param {Array} query
   * @param {Object} data
   * @return {Boolean}
   */
  q$nin(value:string, query:any, data:any):boolean {
    return !this.q$in(value, query, data);
  }

  /**
   * Checks length of a string.
   *
   * @param {String} value
   * @param {Number} query
   * @param {Object} data
   * @return {Boolean}
   */
  q$length(value:string, query:number, data:Record<string, unknown>):boolean {
    return (value ? value.length : 0) === query;
  }
}

export default SchemaTypeString;
