'use strict';
var cloneDeep = require('rfdc')();
var Document = /** @class */ (function () {
    /**
     * Document constructor.
     *
     * @param {object} data
     */
    function Document(data) {
        if (data) {
            Object.assign(this, data);
        }
    }
    /**
     * Saves the document.
     *
     * @param {function} [callback]
     * @return {Promise}
     */
    Document.prototype.save = function (callback) {
        return this._model.save(this, callback);
    };
    /**
     * Updates the document.
     *
     * @param {object} data
     * @param {function} [callback]
     * @return {Promise}
     */
    Document.prototype.update = function (data, callback) {
        return this._model.updateById(this._id, data, callback);
    };
    /**
     * Replaces the document.
     *
     * @param {object} data
     * @param {function} [callback]
     * @return {Promise}
     */
    Document.prototype.replace = function (data, callback) {
        return this._model.replaceById(this._id, data, callback);
    };
    /**
     * Removes the document.
     *
     * @param {function} [callback]
     * @return {Promise}
     */
    Document.prototype.remove = function (callback) {
        return this._model.removeById(this._id, callback);
    };
    /**
     * Returns a plain JavaScript object.
     *
     * @return {object}
     */
    Document.prototype.toObject = function () {
        var keys = Object.keys(this);
        var obj = {};
        for (var i = 0, len = keys.length; i < len; i++) {
            var key = keys[i];
            // Don't deep clone getters in order to avoid "Maximum call stack size
            // exceeded" error
            obj[key] = isGetter(this, key) ? this[key] : cloneDeep(this[key]);
        }
        return obj;
    };
    /**
     * Returns a string representing the document.
     *
     * @return {String}
     */
    Document.prototype.toString = function () {
        return JSON.stringify(this);
    };
    /**
     * Populates document references.
     *
     * @param {String|Object} expr
     * @return {Document}
     */
    Document.prototype.populate = function (expr) {
        var stack = this._schema._parsePopulate(expr);
        return this._model._populate(this, stack);
    };
    return Document;
}());
function isGetter(obj, key) {
    return Object.getOwnPropertyDescriptor(obj, key).get;
}
module.exports = Document;
