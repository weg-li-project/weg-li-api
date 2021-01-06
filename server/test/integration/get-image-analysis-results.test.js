/* eslint-disable global-require */
const express = require('express');
const uuid = require('uuid');

const rewiremock = require('rewiremock/node');
const request = require('supertest');
const sinon = require('sinon');

require('./set-environment')();

console.error = sinon.stub();

const ENDPOINT = '/analyze/image/:imageToken';
const getEndpoint = (imageToken) => ENDPOINT.replace(':imageToken', imageToken);

describe(`GET ${ENDPOINT}`, () => {
  let app;
  let fileStorage = {};

  it('should return suggestions when provided a valid UUID v4', async () => {
    await request(app)
      .get(getEndpoint(uuid.v4()))
      .send()
      .expect(200)
      .expect({ suggestions: {} });
  });

  it('should return an error when no imageToken param provided', async () => {
    await request(app).get(getEndpoint('')).send().expect(404);
  });

  it('should return an error when imageToken is not a valid v4 UUID (1)', async () => {
    await request(app)
      .get(getEndpoint("I'm an image token!"))
      .send()
      .expect(400);
  });

  it('should return an error when imageToken is not a valid v4 UUID (2)', async () => {
    await request(app).get(getEndpoint(uuid.v1())).send().expect(400);
  });

  it('should return an error when file storage throws', async () => {
    fileStorage.getFileUrlsByToken = () => {
      throw new Error();
    };
    await request(app).get(getEndpoint(uuid.v4())).send().expect(500);
  });

  beforeEach(() => {
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
    rewiremock.disable();
  });
});
