/* eslint-disable global-require */
const fs = require('fs');
const express = require('express');

const request = require('supertest');
const { StatusCode } = require('status-code-enum');
const sinon = require('sinon');
const assert = require('assert');

const ENDPOINT = '/docs';

describe(`GET ${ENDPOINT} (Swagger Explorer)`, () => {
  let app;

  it('should return HTTP Status 200 (OK)', async () => {
    await request(app)
      .get(ENDPOINT)
      .redirects(1)
      .send()
      .expect(StatusCode.SuccessOK)
      .expect((response) => {
        assert.ok(response.text.includes('swagger'));
      });
  });

  // Uses state caused by previous GET request
  it('should not read yaml file again when requested in two subsequent calls', async () => {
    sinon.stub(fs, 'readFileSync').returns();
    await request(app)
      .get(ENDPOINT)
      .redirects(1)
      .send()
      .expect(StatusCode.SuccessOK)
      .expect((response) => {
        assert.ok(response.text.includes('swagger'));
      });
    sinon.assert.notCalled(fs.readFileSync);
  });

  beforeEach(() => {
    app = express();
    app.use(require('../../src/index').api);
  });

  afterEach(() => {
    sinon.restore();
  });
});
