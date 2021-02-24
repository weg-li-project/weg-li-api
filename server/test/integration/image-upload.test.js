/* eslint-disable global-require */
const express = require('express');

const rewiremock = require('rewiremock/node');
const request = require('supertest');
const { StatusCode } = require('status-code-enum');
const sinon = require('sinon');

require('./set-environment')();

console.error = sinon.stub();

const ENDPOINT = '/analyze/image/upload';

describe(`GET ${ENDPOINT} (Image Upload)`, () => {
  let app;
  let fileStorage;

  it('should return HTTP Status 200 (OK) and two upload urls when provided with quantity 2', async () => {
    await request(app)
      .get(ENDPOINT)
      .query({ quantity: 2 })
      .send()
      .expect(StatusCode.SuccessOK)
      .expect({
        token: 'Unique Image Token',
        google_cloud_urls: ['URL', 'URL'],
      });
  });

  it('should return HTTP Status 400 (Bad Error) and an error when no quantity query provided', async () => {
    await request(app)
      .get(ENDPOINT)
      .send()
      .expect(StatusCode.ClientErrorBadRequest);
  });

  it('should return an error when quantity is null', async () => {
    await request(app)
      .get(ENDPOINT)
      .query({ quantity: null })
      .send()
      .expect(StatusCode.ClientErrorBadRequest);
  });

  it('should return HTTP Status 400 (Bad Error) and an error when quantity is not an integer', async () => {
    await request(app)
      .get(ENDPOINT)
      .query({ quantity: 'one' })
      .send()
      .expect(StatusCode.ClientErrorBadRequest);
  });

  it('should return HTTP Status 400 (Bad Error) and an error when quantity is lower than 1', async () => {
    await request(app)
      .get(ENDPOINT)
      .query({ quantity: 0 })
      .send()
      .expect(StatusCode.ClientErrorBadRequest);
  });

  it('should return HTTP Status 400 (Bad Error) and an error when quantity is higher than 5', async () => {
    await request(app)
      .get(ENDPOINT)
      .query({ quantity: 6 })
      .send()
      .expect(StatusCode.ClientErrorBadRequest);
  });

  it('should return HTTP Status 500 (Internal Error) and an error when FileStorage throws an error', async () => {
    fileStorage.getUniqueImageToken = () => {
      throw new Error();
    };
    await request(app)
      .get(ENDPOINT)
      .query({ quantity: 2 })
      .send()
      .expect(StatusCode.ServerErrorInternal);
  });

  beforeEach(() => {
    fileStorage = {};
    fileStorage.shared = fileStorage;
    fileStorage.getUniqueImageToken = () => 'Unique Image Token';
    fileStorage.getUploadUrls = (folderName, quantity) => Array(quantity).fill('URL');
    rewiremock('../../src/core/file-storage.js').with(fileStorage);
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
