const rewiremock = require('rewiremock/node');
const supertest = require('supertest');
const express = require('express');
const { StatusCode } = require('status-code-enum');
const Authorization = require('../../src/core/authorization');
const User = require('../../src/models/user');

/** @author Niclas Kühnapfel */
describe('POST /analyze/data', () => {
  const app = express();

  const mockUser = User.generate();
  const mockAccessToken = Authorization.generateAccessToken();

  // eslint-disable-next-line func-names
  const RewiredAuthorization = function () {};
  // eslint-disable-next-line func-names
  const RewiredRecommenderCore = function () {};

  // Rewire authorization methods
  RewiredAuthorization.authorizeUser = async (user, accessToken) => accessToken === mockAccessToken;
  RewiredAuthorization.validateAuthorizationHeader = Authorization.validateAuthorizationHeader;
  RewiredAuthorization.extractAccessToken = Authorization.extractAccessToken;

  // Rewire recommender methods
  RewiredRecommenderCore.prototype.getRecommendations = async () => new Promise((resolve) => {
    resolve([{ violation_type: 6, score: 0.1563, severity_type: 0 }]);
  });

  before(() => {
    rewiremock('../../src/core/authorization.js').with(RewiredAuthorization);
    rewiremock('../../src/core/recommender/recommender-core.js').with(
      RewiredRecommenderCore
    );
    rewiremock.enable();
    // eslint-disable-next-line global-require
    app.use(require('../../src/index').api);
  });

  after(() => {
    rewiremock.disable();
  });

  it('should return an HTTP status code 200 (OK)', async () => {
    const mockRequestBody = {
      user_id: mockUser.id,
      location: {
        latitude: 52.550127300460765,
        longitude: 13.37069649848694,
      },
      time: Math.floor(Date.now() / 1000),
    };

    await supertest(app)
      .post('/analyze/data')
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .send(mockRequestBody)
      .expect(StatusCode.SuccessOK)
      .expect([{ violation_type: 6, score: 0.1563, severity_type: 0 }]);
  });

  it('should return an HTTP status code 200 (OK) if no user id is given', async () => {
    const mockRequestBody = {
      location: {
        latitude: 52.550127300460765,
        longitude: 13.37069649848694,
      },
      time: Math.floor(Date.now() / 1000),
    };

    await supertest(app)
      .post('/analyze/data')
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .send(mockRequestBody)
      .expect(StatusCode.SuccessOK)
      .expect([{ violation_type: 6, score: 0.1563, severity_type: 0 }]);
  });

  it('should return an HTTP status code 400 (Bad Request) if invalid user id is given', async () => {
    const mockRequestBody = {
      user_id: 'error',
      location: {
        latitude: 52.550127300460765,
        longitude: 13.37069649848694,
      },
      time: Math.floor(Date.now() / 1000),
    };

    await supertest(app)
      .post('/analyze/data')
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .send(mockRequestBody)
      .expect(StatusCode.ClientErrorBadRequest)
      .expect({});
  });

  it('should return an HTTP status code 400 (Bad Request) if no time is given', async () => {
    const mockRequestBody = {
      user_id: mockUser.id,
      location: {
        latitude: 52.550127300460765,
        longitude: 13.37069649848694,
      },
    };

    await supertest(app)
      .post('/analyze/data')
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .send(mockRequestBody)
      .expect(StatusCode.ClientErrorBadRequest)
      .expect({});
  });

  it('should return an HTTP status code 400 (Bad Request) if invalid time is given', async () => {
    const mockRequestBody = {
      user_id: mockUser.id,
      location: {
        latitude: 52.550127300460765,
        longitude: 13.37069649848694,
      },
      time: 'error',
    };

    await supertest(app)
      .post('/analyze/data')
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .send(mockRequestBody)
      .expect(StatusCode.ClientErrorBadRequest)
      .expect({});
  });

  it('should return an HTTP status code 400 (Bad Request) if no location is given', async () => {
    const mockRequestBody = {
      user_id: mockUser.id,
      time: Math.floor(Date.now() / 1000),
    };

    await supertest(app)
      .post('/analyze/data')
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .send(mockRequestBody)
      .expect(StatusCode.ClientErrorBadRequest)
      .expect({});
  });

  it('should return an HTTP status code 400 (Bad Request) if invalid location is given', async () => {
    const mockRequestBody = {
      user_id: mockUser.id,
      location: {
        latitude: 'error',
        longitude: 13.37069649848694,
      },
      time: Math.floor(Date.now() / 1000),
    };

    await supertest(app)
      .post('/analyze/data')
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .send(mockRequestBody)
      .expect(StatusCode.ClientErrorBadRequest)
      .expect({});
  });

  it('should return an HTTP status code 400 (Bad Request) if invalid location is given', async () => {
    const mockRequestBody = {
      user_id: mockUser.id,
      location: {
        latitude: 52.550127300460765,
        longitude: 'error',
      },
      time: Math.floor(Date.now() / 1000),
    };

    await supertest(app)
      .post('/analyze/data')
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .send(mockRequestBody)
      .expect(StatusCode.ClientErrorBadRequest)
      .expect({});
  });

  it('should return an HTTP status code 400 (Bad Request) without request body', async () => {
    await supertest(app)
      .post('/analyze/data')
      .set('Authorization', `Bearer ${mockAccessToken}`)
      .expect(StatusCode.ClientErrorBadRequest)
      .expect({});
  });

  it('should return an HTTP status code 403 (Forbidden) if wrong authorization token is given', async () => {
    const mockRequestBody = {
      user_id: mockUser.id,
      location: {
        latitude: 52.550127300460765,
        longitude: 13.37069649848694,
      },
      time: Math.floor(Date.now() / 1000),
    };

    await supertest(app)
      .post('/analyze/data')
      .set('Authorization', `Bearer ${Authorization.generateAccessToken()}`)
      .send(mockRequestBody)
      .expect(StatusCode.ClientErrorForbidden)
      .expect({});
  });

  it('should return an HTTP status code 403 (Forbidden) if no authorization token is given', async () => {
    const mockRequestBody = {
      user_id: mockUser.id,
      location: {
        latitude: 52.550127300460765,
        longitude: 13.37069649848694,
      },
      time: Math.floor(Date.now() / 1000),
    };

    await supertest(app)
      .post('/analyze/data')
      .send(mockRequestBody)
      .expect(StatusCode.ClientErrorForbidden)
      .expect({});
  });
});
