/* eslint-disable no-underscore-dangle */
/* eslint-disable global-require */
const assert = require('assert');
const rewiremock = require('rewiremock/node');

const crypto = require('crypto');
const Authorization = require('../../../src/core/authorization');
const User = require('../../../src/models/user');

/** @author Lukas Trommer */
describe('Authorization', () => {
  const accessToken = Authorization.generateAccessToken();
  const accessTokenHash = Authorization.hashAccessToken(accessToken);

  describe('#generateAccessToken', () => {
    it('should return a 32 byte (64 hexadecimal characters long) access token string', () => {
      assert.match(accessToken, /^[0-9A-Fa-f]{64}$/);
    });
  });

  describe('#hashAccessToken', () => {
    it('should return a valid hexadecimal encoded SHA-256 hash of an access token', () => {
      assert.strictEqual(
        crypto.createHash('sha256').update(accessToken).digest('hex'),
        accessTokenHash
      );
    });
  });

  describe('#compareAccessToken', () => {
    it('should return true when comparing a valid hash to its corresponding access token', () => {
      assert.strictEqual(
        Authorization.compareAccessToken(accessToken, accessTokenHash),
        true
      );
    });

    it('should return false when comparing a hash to a non-corresponding access token', () => {
      assert.strictEqual(
        Authorization.compareAccessToken(
          accessToken,
          Authorization.hashAccessToken(Authorization.generateAccessToken())
        ),
        false
      );
    });
  });

  describe('#validateAuthorizationHeader', () => {
    it('should return true when called with a valid Authorization header', () => {
      assert.strictEqual(
        Authorization.validateAuthorizationHeader(`Bearer ${accessToken}`),
        true
      );
    });

    it('should return false when called with an invalid Authorization header (Basic authorization)', () => {
      assert.strictEqual(
        Authorization.validateAuthorizationHeader(`Basic ${accessToken}`),
        false
      );
    });

    it('should return false when called with an invalid Authorization header (No type)', () => {
      assert.strictEqual(
        Authorization.validateAuthorizationHeader(accessToken),
        false
      );
    });

    it('should return false when called with undefined Authorization header', () => {
      assert.strictEqual(
        Authorization.validateAuthorizationHeader(undefined),
        false
      );
    });
  });

  describe('#extractAccessToken', () => {
    it('should return the access token provided as Bearer token in the Authorization header', () => {
      assert.strictEqual(
        Authorization.extractAccessToken(`Bearer ${accessToken}`),
        accessToken
      );
    });

    it('should return null if no access token is provided in the Authorization header', () => {
      assert.strictEqual(Authorization.extractAccessToken('Bearer '), null);
    });

    it('should return null if the access token provided in the Authorization header is no Bearer token', () => {
      assert.strictEqual(
        Authorization.extractAccessToken(`Basic ${accessToken}`),
        null
      );
    });

    it('should return null when called with undefined Authorization header', () => {
      assert.strictEqual(Authorization.extractAccessToken(undefined), null);
    });
  });

  describe('#authorizeUser', () => {
    const user = User.generate();

    const UserDatabaseHandle = function () {};

    before(() => {
      rewiremock('../../../src/core/database/database-users.js').with(
        UserDatabaseHandle
      );
      rewiremock.enable();
    });

    after(() => {
      rewiremock.disable();
    });

    it('should return true when called with user and corresponding access token', async () => {
      UserDatabaseHandle.prototype.queryUserAccess = async () => accessTokenHash;

      // Require Authorization module again to use rewired database handle
      const _Authorization = require('../../../src/core/authorization');

      assert.strictEqual(
        await _Authorization.authorizeUser(user, accessToken),
        true
      );
    });

    it('should return false when called with user and non-corresponding access token', async () => {
      // eslint-disable-next-line max-len
      UserDatabaseHandle.prototype.queryUserAccess = async () => Authorization.hashAccessToken(Authorization.generateAccessToken());

      // Require Authorization module again to use rewired database handle
      const _Authorization = require('../../../src/core/authorization');

      assert.strictEqual(
        await _Authorization.authorizeUser(user, accessToken),
        false
      );
    });

    it('should return false when called with undefined user', async () => {
      assert.strictEqual(
        await Authorization.authorizeUser(undefined, accessToken),
        false
      );
    });

    it('should return false when called with undefined access token', async () => {
      assert.strictEqual(
        await Authorization.authorizeUser(user, undefined),
        false
      );
    });
  });
});
