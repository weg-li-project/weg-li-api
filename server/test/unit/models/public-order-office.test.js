const gaxios = require('gaxios');
const assert = require('assert');
const sinon = require('sinon');
const {
  PublicOrderOfficeResolver,
} = require('../../../src/core/public-order-office');
const { PublicOrderOffice } = require('../../../src/core/public-order-office');

describe('Public Order Office', () => {
  const validPublicOrderOffice = new PublicOrderOffice('name', 'email');

  describe('#constructor', () => {
    it('should create a PublicOrderOffice object when provided valid values', () => {
      const publicOrderOffice = new PublicOrderOffice(
        validPublicOrderOffice.name,
        validPublicOrderOffice.emailAddress
      );
      assert.deepStrictEqual(publicOrderOffice, validPublicOrderOffice);
    });

    it.skip('should throw an error when initialized with invalid name', () => {
      assert.throws(
        () => new PublicOrderOffice({}, validPublicOrderOffice.emailAddress)
      );
    });

    it('should throw an error when initialized without name', () => {
      assert.throws(
        () => new PublicOrderOffice(null, validPublicOrderOffice.emailAddress)
      );
    });

    it('should throw an error when initialized without email address', () => {
      assert.throws(
        () => new PublicOrderOffice(validPublicOrderOffice.name, null)
      );
    });

    it.skip('should throw an error when initialized with invalid email address', () => {
      assert.throws(
        () => new PublicOrderOffice(validPublicOrderOffice.name, {})
      );
    });
  });
});

describe('Public Order Office Resolver', () => {
  const validZipCode = '10711';
  const publicOrderOfficeResolver = new PublicOrderOfficeResolver();

  describe('#resolve', () => {
    it('should throw an error if no zipcode provided', async () => {
      await assert.rejects(() => publicOrderOfficeResolver.resolve());
    });

    it('should throw an error if gaxios#request throws', async () => {
      sinon.stub(gaxios, 'request').callsFake(() => {
        throw new Error();
      });

      await assert.rejects(() => publicOrderOfficeResolver.resolve(validZipCode));
    });

    it('should return null if gaxios#request returns status code 404 (Not Found)', async () => {
      sinon.stub(gaxios, 'request').callsFake(() => {
        const error = new Error();
        error.response = { status: 404 };
        throw error;
      });

      const value = await publicOrderOfficeResolver.resolve(validZipCode);

      assert.strictEqual(value, null);
    });

    it('should throw an error if gaxios#request response has no data', async () => {
      sinon.stub(gaxios, 'request').returns({});

      await assert.rejects(() => publicOrderOfficeResolver.resolve(validZipCode));
    });

    it('should return a PublicOrderOffice when gaxios#request returns valid data', async () => {
      const expected = new PublicOrderOffice('name', 'email');
      sinon
        .stub(gaxios, 'request')
        .returns({ data: { name: 'name', email: 'email' } });

      const value = await publicOrderOfficeResolver.resolve(validZipCode);

      assert.deepStrictEqual(value, expected);
    });

    it('should return null when gaxios#request returns invalid name', async () => {
      sinon
        .stub(gaxios, 'request')
        .returns({ data: { name: '', email: 'email' } });

      const value = await publicOrderOfficeResolver.resolve(validZipCode);

      assert.strictEqual(value, null);
    });

    it('should return null when gaxios#request returns invalid email', async () => {
      sinon
        .stub(gaxios, 'request')
        .returns({ data: { name: 'name', email: '' } });

      const value = await publicOrderOfficeResolver.resolve(validZipCode);

      assert.strictEqual(value, null);
    });

    afterEach(() => {
      sinon.restore();
    });
  });
});
