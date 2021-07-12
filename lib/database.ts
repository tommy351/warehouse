'use strict';

import Bluebird from 'bluebird';
import { createReadStream, promises as fsPromises, writev } from 'graceful-fs';
import JSONStream from 'JSONStream';
import { pipeline, Stream } from 'stream';
import pkg from '../package.json';
import WarehouseError from './error';
import Model from './model';
import Schema from './schema';
import SchemaType from './schematype';
const { open } = fsPromises;
const pipelineAsync = Bluebird.promisify(pipeline) as (...args: Stream[]) => Bluebird<unknown>;

let _writev: (handle: fsPromises.FileHandle, buffers: Buffer[]) => Promise<unknown>;

if (typeof writev === 'function') {
  _writev = (handle, buffers) => handle.writev(buffers);
} else {
  _writev = async (handle, buffers) => {
    for (const buffer of buffers) await handle.write(buffer);
  };
}

async function exportAsync(database, path) {
  const handle = await open(path, 'w');

  try {
    // Start body & Meta & Start models
    await handle.write(`{"meta":${JSON.stringify({
      version: database.options.version,
      warehouse: pkg.version
    })},"models":{`);

    const models = database._models;
    const keys = Object.keys(models);
    const { length } = keys;

    // models body
    for (let i = 0; i < length; i++) {
      const key = keys[i];

      if (!models[key]) continue;

      const buffers = [];

      if (i) buffers.push(Buffer.from(',', 'ascii'));

      buffers.push(Buffer.from(`"${key}":`));

      buffers.push(Buffer.from(models[key]._export()));
      await _writev(handle, buffers);
    }

    // End models
    await handle.write('}}');
  } finally {
    await handle.close();
  }
}

class Database {

  /**
   * Database constructor.
   *
   * @param {object} [options]
   *   @param {number} [options.version=0] Database version
   *   @param {string} [options.path] Database path
   *   @param {function} [options.onUpgrade] Triggered when the database is upgraded
   *   @param {function} [options.onDowngrade] Triggered when the database is downgraded
   */
  constructor(options) {
    this.options = Object.assign({
      version: 0,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onUpgrade() {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onDowngrade() {}
    }, options);

    this._models = {};

    class _Model extends Model {}

    this.Model = _Model;

    _Model.prototype._database = this;
  }

  /**
   * Creates a new model.
   *
   * @param {string} name
   * @param {Schema|object} [schema]
   * @return {Model}
   */
  model(name, schema) {
    if (this._models[name]) {
      return this._models[name];
    }

    this._models[name] = new this.Model(name, schema);
    const model = this._models[name];
    return model;
  }

  /**
   * Loads database.
   *
   * @param {function} [callback]
   * @return {Promise}
   */
  load(callback) {
    const { path, onUpgrade, onDowngrade, version: newVersion } = this.options;

    if (!path) throw new WarehouseError('options.path is required');

    let oldVersion = 0;

    const getMetaCallBack = data => {
      if (data.meta && data.meta.version) {
        oldVersion = data.meta.version;
      }
    };

    // data event arg0 wrap key/value pair.
    const parseStream = JSONStream.parse('models.$*');

    parseStream.once('header', getMetaCallBack);
    parseStream.once('footer', getMetaCallBack);

    parseStream.on('data', data => {
      this.model(data.key)._import(data.value);
    });

    const rs = createReadStream(path, 'utf8');

    return pipelineAsync(rs, parseStream).then(() => {
      if (newVersion > oldVersion) {
        return onUpgrade(oldVersion, newVersion);
      } else if (newVersion < oldVersion) {
        return onDowngrade(oldVersion, newVersion);
      }
    }).asCallback(callback);
  }

  /**
   * Saves database.
   *
   * @param {function} [callback]
   * @return {Promise}
   */
  save(callback) {
    const { path } = this.options;

    if (!path) throw new WarehouseError('options.path is required');
    return Bluebird.resolve(exportAsync(this, path)).asCallback(callback);
  }

  toJSON() {
    const models = Object.keys(this._models)
      .reduce((obj, key) => {
        const value = this._models[key];
        if (value != null) obj[key] = value;
        return obj;
      }, {});

    return {
      meta: {
        version: this.options.version,
        warehouse: pkg.version
      }, models
    };
  }
}

Database.prototype.Schema = Schema;
Database.Schema = Database.prototype.Schema;
Database.prototype.SchemaType = SchemaType;
Database.SchemaType = Database.prototype.SchemaType;
Database.version = pkg.version;

module.exports = Database;
