/* eslint-disable global-require */
const express = require('express');
const uuid = require('uuid');

const rewiremock = require('rewiremock/node');
const request = require('supertest');
const { StatusCode } = require('status-code-enum');
const sinon = require('sinon');

require('./set-environment')();

console.error = sinon.stub();

const ENDPOINT = '/analyze/image/:imageToken';
const getEndpoint = (imageToken) => ENDPOINT.replace(':imageToken', imageToken);

describe(`GET ${ENDPOINT} (Image Analysis)`, () => {
  let app;
  let fileStorage;

  it('should return HTTP Status 200 (OK) and suggestions when provided a valid UUID v4', async () => {
    await request(app)
      .get(getEndpoint(uuid.v4()))
      .send()
      .expect(StatusCode.SuccessOK)
      .expect({ suggestions: {} });
  });

  it('should return HTTP Status 404 (Not Found) and an error when no imageToken param provided', async () => {
    await request(app)
      .get(getEndpoint(''))
      .send()
      .expect(StatusCode.ClientErrorNotFound);
  });

  it(
    'should return HTTP Status 400 (Bad Request) '
      + 'and an error when imageToken is not a valid v4 UUID (1)',
    async () => {
      await request(app)
        .get(getEndpoint("I'm an image token!"))
        .send()
        .expect(StatusCode.ClientErrorBadRequest);
    }
  );

  it(
    'should return HTTP Status 400 (Bad Request) '
      + 'and an error when imageToken is not a valid v4 UUID (2)',
    async () => {
      await request(app)
        .get(getEndpoint(uuid.v1()))
        .send()
        .expect(StatusCode.ClientErrorBadRequest);
    }
  );

  it('should return HTTP Status 500 (Internal Error) and an error when file storage throws', async () => {
    fileStorage.getFileUrlsByToken = () => {
      throw new Error();
    };
    await request(app)
      .get(getEndpoint(uuid.v4()))
      .send()
      .expect(StatusCode.ServerErrorInternal);
  });

  beforeEach(() => {
    fileStorage = {};
    fileStorage.shared = fileStorage;
    fileStorage.getFileUrlsByToken = (imageToken) => Array(1).fill(`gs://${imageToken}/0.jpg`);
    rewiremock('../../src/core/file-storage.js').with(fileStorage);
    rewiremock('gaxios').with({
      async request() {
        return { data: { suggestions: {} } };
      },
    });
    rewiremock.enable();
    app = express();
    app.use(require('../../src/index').api);
  });

  afterEach(() => {
    fileStorage = {};
    fileStorage.shared = fileStorage;
    rewiremock.disable();
  });
});
