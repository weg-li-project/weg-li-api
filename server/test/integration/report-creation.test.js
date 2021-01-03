/* eslint-disable global-require */
const rewiremock = require('rewiremock/node');
const supertest = require('supertest');
const express = require('express');
const uuid = require('uuid');
const { StatusCode } = require('status-code-enum');
const Authorization = require('../../src/core/authorization');
const User = require('../../src/models/user');
const errors = require('../../src/controllers/assets/errors');

const ENDPOINT = '/report';

describe(`POST ${ENDPOINT} (Report Creation)`, async () => {
  const app = express();

  const mockUser = User.generate();
  const mockAccessToken = Authorization.generateAccessToken();
  const mockImageToken = uuid.v4();
  let imageTokenExisting = true;

  const RewiredAuthorization = function () {};
  const RewiredReportDatabaseHandle = function () {};
  const RewiredFileStorage = {};

  // Rewire authorization methods
  RewiredAuthorization.authorizeUser = async (user, accessToken) => accessToken === mockAccessToken;

  RewiredAuthorization.validateAuthorizationHeader = Authorization.validateAuthorizationHeader;
  RewiredAuthorization.extractAccessToken = Authorization.extractAccessToken;

  // Rewire report database handle
  RewiredReportDatabaseHandle.prototype.insertReport = async () => undefined;

  // Rewire file storage
  RewiredFileStorage.getFilesByToken = async () => (imageTokenExisting ? ['some image url'] : []);

  before(() => {
    rewiremock('../../src/core/authorization.js').with(RewiredAuthorization);
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

  it('should return an HTTP status code 200 (OK) with empty response body when the creation was successful', (done) => {
    imageTokenExisting = true;

    const mockRequestBody = {
      user_id: mockUser.id,
      report: {
        violation_type: 1,
        time: Math.floor(Date.now() / 1000),
        location: {
          latitude: 52.550127300460765,
          longitude: 13.37069649848694,
        },
        image_token: mockImageToken,
      },
    };

    supertest(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .send(mockRequestBody)
      .expect(StatusCode.SuccessOK)
      .expect({}, done);
  });

  it(
    'should return an HTTP status code 200 (OK) with empty response body when called without Authorization '
      + 'header, without user ID and when the creation was successful',
    (done) => {
      imageTokenExisting = true;

      const mockRequestBody = {
        report: {
          violation_type: 1,
          time: Math.floor(Date.now() / 1000),
          location: {
            latitude: 52.550127300460765,
            longitude: 13.37069649848694,
          },
          image_token: mockImageToken,
        },
      };

      supertest(app)
        .post(ENDPOINT)
        .send(mockRequestBody)
        .expect(StatusCode.SuccessOK)
        .expect({}, done);
    }
  );

  it(
    'should return an HTTP status code 403 (Forbidden) when called with valid Authorization header not '
      + 'related to the provided user ID',
    (done) => {
      imageTokenExisting = true;

      const mockRequestBody = {
        user_id: mockUser.id,
        report: {
          violation_type: 1,
          time: Math.floor(Date.now() / 1000),
          location: {
            latitude: 52.550127300460765,
            longitude: 13.37069649848694,
          },
          image_token: mockImageToken,
        },
      };

      supertest(app)
        .post(ENDPOINT)
        .set('Authorization', `Bearer ${Authorization.generateAccessToken()}`)
        .send(mockRequestBody)
        .expect(StatusCode.ClientErrorForbidden)
        .expect({}, done);
    }
  );

  it('should return an HTTP status code 400 (Bad Request) when called without request body', (done) => {
    supertest(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .send()
      .expect(StatusCode.ClientErrorBadRequest)
      .expect({}, done);
  });

  it('should return an HTTP status code 400 (Bad Request) when called without violation type', (done) => {
    imageTokenExisting = true;

    const mockRequestBody = {
      user_id: mockUser.id,
      report: {
        time: Math.floor(Date.now() / 1000),
        location: {
          latitude: 52.550127300460765,
          longitude: 13.37069649848694,
        },
        image_token: mockImageToken,
      },
    };

    supertest(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .send(mockRequestBody)
      .expect(StatusCode.ClientErrorBadRequest)
      .expect({}, done);
  });

  it('should return an HTTP status code 400 (Bad Request) when called without violation type', (done) => {
    imageTokenExisting = true;

    const mockRequestBody = {
      user_id: mockUser.id,
      report: {
        time: Math.floor(Date.now() / 1000),
        location: {
          latitude: 52.550127300460765,
          longitude: 13.37069649848694,
        },
        image_token: mockImageToken,
      },
    };

    supertest(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .send(mockRequestBody)
      .expect(StatusCode.ClientErrorBadRequest)
      .expect({}, done);
  });

  it('should return an HTTP status code 400 (Bad Request) when called without violation time', (done) => {
    imageTokenExisting = true;

    const mockRequestBody = {
      user_id: mockUser.id,
      report: {
        violation_type: 1,
        location: {
          latitude: 52.550127300460765,
          longitude: 13.37069649848694,
        },
        image_token: mockImageToken,
      },
    };

    supertest(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .send(mockRequestBody)
      .expect(StatusCode.ClientErrorBadRequest)
      .expect({}, done);
  });

  it('should return an HTTP status code 400 (Bad Request) when called without location', (done) => {
    imageTokenExisting = true;

    const mockRequestBody = {
      user_id: mockUser.id,
      report: {
        violation_type: 1,
        time: Math.floor(Date.now() / 1000),
        image_token: mockImageToken,
      },
    };

    supertest(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .send(mockRequestBody)
      .expect(StatusCode.ClientErrorBadRequest)
      .expect({}, done);
  });

  it('should return an HTTP status code 400 (Bad Request) when called without image token', (done) => {
    const mockRequestBody = {
      user_id: mockUser.id,
      report: {
        violation_type: 1,
        time: Math.floor(Date.now() / 1000),
        location: {
          latitude: 52.550127300460765,
          longitude: 13.37069649848694,
        },
      },
    };

    supertest(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .send(mockRequestBody)
      .expect(StatusCode.ClientErrorBadRequest)
      .expect({}, done);
  });

  it('should return an HTTP status code 400 (Bad Request) when called with invalid image token', (done) => {
    const mockRequestBody = {
      user_id: mockUser.id,
      report: {
        violation_type: 1,
        time: Math.floor(Date.now() / 1000),
        location: {
          latitude: 52.550127300460765,
          longitude: 13.37069649848694,
        },
        image_token: 'invalid token',
      },
    };

    supertest(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .send(mockRequestBody)
      .expect(400)
      .expect({}, done);
  });

  it('should return an HTTP status code 409 (Conflict) when called with invalid image token', (done) => {
    imageTokenExisting = false;

    const mockRequestBody = {
      user_id: mockUser.id,
      report: {
        violation_type: 1,
        time: Math.floor(Date.now() / 1000),
        location: {
          latitude: 52.550127300460765,
          longitude: 13.37069649848694,
        },
        image_token: mockImageToken,
      },
    };

    supertest(app)
      .post(ENDPOINT)
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .send(mockRequestBody)
      .expect(StatusCode.ClientErrorConflict)
      .expect(errors.UNKNOWN_IMAGE_TOKEN, done);
  });
});
