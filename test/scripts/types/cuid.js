'use strict';

const should = require('chai').should(); // eslint-disable-line
const ValidationError = require('../../../dist/error/validation');

describe('SchemaTypeCUID', () => {
  const SchemaTypeCUID = require('../../../dist/types/cuid');
  const type = new SchemaTypeCUID('test');

  it('cast()', () => {
    type.cast('foo').should.eql('foo');
    should.not.exist(type.cast());
  });

  it('cast() - required', () => {
    const type = new SchemaTypeCUID('test', {required: true});
    type.cast().should.exist;
  });

  it('validate()', () => {
    type.validate('ch72gsb320000udocl363eofy').should.eql('ch72gsb320000udocl363eofy');

    (() => type.validate('foo')).should.to.throw(ValidationError, '`foo` is not a valid CUID');
  });
});
