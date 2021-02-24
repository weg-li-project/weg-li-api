/* eslint-disable global-require */
/* eslint-disable no-unused-vars */
const rewiremock = require('rewiremock/node');
const supertest = require('supertest');
const express = require('express');
const { StatusCode } = require('status-code-enum');
const Authorization = require('../../src/core/authorization');
const User = require('../../src/models/user');

const ENDPOINT = '/user/:user_id';
const getEndpoint = (user) => ENDPOINT.replace(':user_id', user.id);

describe(`DELETE ${ENDPOINT} (User Deletion)`, () => {
  const app = express();

  const mockUser = User.generate();
  const mockAccessToken = Authorization.generateAccessToken();

  const RewiredAuthorization = function () {};
  const RewiredUserDatabaseHandle = function (database) {};
  const RewiredReportDatabaseHandle = function (database) {};
  const RewiredFileStorage = {};

  // Rewire authorization methods
  RewiredAuthorization.authorizeUser = async (user, accessToken) => accessToken === mockAccessToken;

  RewiredAuthorization.deleteAuthorization = async (user) => undefined;
  RewiredAuthorization.validateAuthorizationHeader = Authorization.validateAuthorizationHeader;
  RewiredAuthorization.extractAccessToken = Authorization.extractAccessToken;

  // Rewire user database handle
  RewiredUserDatabaseHandle.prototype.deleteUser = async (user) => undefined;

  const MockDatabase = function () {};
  const MockTransaction = function () {};
  MockTransaction.prototype.commit = () => undefined;
  MockTransaction.prototype.rollback = () => undefined;
  MockDatabase.prototype.newTransaction = () => new MockTransaction();
  RewiredUserDatabaseHandle.prototype.database = new MockDatabase();

  // Rewire report database handle
  RewiredReportDatabaseHandle.prototype.queryUserReportImageTokens = async (
    user
  ) => [];
  RewiredReportDatabaseHandle.prototype.deleteUserReports = async (user) => undefined;

  // Rewire file storage
  RewiredFileStorage.deleteImagesByTokens = async (imageTokens) => undefined;
  RewiredFileStorage.shared = RewiredFileStorage;

  before(() => {
    rewiremock('../../src/core/authorization.js').with(RewiredAuthorization);
    rewiremock('../../src/core/database/database-users.js').with(
      RewiredUserDatabaseHandle
    );
    rewiremock('../../src/core/database/database-reports.js').with(
      RewiredReportDatabaseHandle
    );
    rewiremock('../../src/core/file-storage.js').with(RewiredFileStorage);
    rewiremock.enable();
    app.use(require('../../src/index').api);
  });

  after(() => {
    rewiremock.disable();
  });

  it('should return an HTTP status code 200 (OK) with empty response body when the deletion was successful', (done) => {
    supertest(app)
      .delete(getEndpoint(mockUser))
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .send()
      .expect(StatusCode.SuccessOK)
      .expect({}, done);
  });

  it('should return an HTTP status code 401 (Unauthorized) when called without Authorization header', (done) => {
    supertest(app)
      .delete(getEndpoint(mockUser))
      .send()
      .expect(StatusCode.ClientErrorUnauthorized)
      .expect({}, done);
  });

  it(
    'should return an HTTP status code 403 (Forbidden) when called with valid Authorization header not '
      + 'related to the user which should be deleted',
    (done) => {
      supertest(app)
        .delete(getEndpoint(mockUser))
        .set('Authorization', `Bearer ${Authorization.generateAccessToken()}`)
        .send()
        .expect(StatusCode.ClientErrorForbidden)
        .expect({}, done);
    }
  );

  it('should return an HTTP status code 400 (Bad Request) when called with invalid user ID', (done) => {
    supertest(app)
      .delete(getEndpoint('invalid uuid'))
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .send()
      .expect(StatusCode.ClientErrorBadRequest)
      .expect({}, done);
  });
});
