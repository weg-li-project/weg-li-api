/* eslint-disable global-require */
const express = require('express');

const rewiremock = require('rewiremock/node');
const request = require('supertest');
const sinon = require('sinon');

require('./set-environment')();

console.error = sinon.stub();

const ENDPOINT = '/analyze/image/upload';

describe(`GET ${ENDPOINT}`, () => {
  let app;
  let fileStorage = {};

  it('should return two upload urls when provided with quantity 2', async () => {
    await request(app)
      .get(ENDPOINT)
      .query({ quantity: 2 })
      .send()
      .expect(200)
      .expect({
        token: 'Unique Image Token',
        google_cloud_urls: ['URL', 'URL'],
      });
  });

  it('should return an error when no quantity query provided', async () => {
    await request(app).get(ENDPOINT).send().expect(400);
  });

  it('should return an error when quantity is null', async () => {
    await request(app)
      .get(ENDPOINT)
      .query({ quantity: null })
      .send()
      .expect(400);
  });

  it('should return an error when quantity is not an integer', async () => {
    await request(app)
      .get(ENDPOINT)
      .query({ quantity: 'one' })
      .send()
      .expect(400);
  });

  it('should return an error when quantity is lower than 1', async () => {
    await request(app).get(ENDPOINT).query({ quantity: 0 }).send()
      .expect(400);
  });

  it('should return an error when quantity is higher than 5', async () => {
    await request(app).get(ENDPOINT).query({ quantity: 6 }).send()
      .expect(400);
  });

  it('should return an error when FileStorage throws an error', async () => {
    fileStorage.getUniqueImageToken = () => {
      throw new Error();
    };
    await request(app).get(ENDPOINT).query({ quantity: 2 }).send()
      .expect(500);
  });

  beforeEach(() => {
    fileStorage.getUniqueImageToken = () => 'Unique Image Token';
    fileStorage.getUploadUrls = (folderName, quantity) => Array(quantity).fill('URL');
    rewiremock('../../src/core/file-storage.js').with(fileStorage);
    rewiremock.enable();
    app = express();
    app.use(require('../../src/index').api);
  });

  afterEach(() => {
    fileStorage = {};
    rewiremock.disable();
  });
});
