/* eslint-disable global-require */
/* eslint-disable no-unused-vars */
const rewiremock = require('rewiremock/node');
const supertest = require('supertest');
const express = require('express');
const { StatusCode } = require('status-code-enum');

const { PublicOrderOffice } = require('../../src/core/public-order-office');

const ENDPOINT = '/report/district/:zipcode';
const getEndpoint = (zipcode) => ENDPOINT.replace(':zipcode', zipcode);

describe(`GET ${getEndpoint()} (District Query)`, () => {
  const app = express();

  const mockZipCode = '13357';
  const mockUnknownZipCode = '07343';
  const mockInvalidZipCode = '1234';
  const mockInvalidZipCode2 = 'a1234';
  const mockOffice = new PublicOrderOffice(
    'Musterstadt',
    'ordnungsamt@musterstadt.de'
  );

  const RewiredPublicOrderOfficeResolver = function () {};

  RewiredPublicOrderOfficeResolver.prototype.resolve = (zipcode) => (zipcode === mockZipCode ? mockOffice : null);

  before(() => {
    rewiremock('../../src/core/public-order-office.js').with({
      PublicOrderOffice,
      PublicOrderOfficeResolver: RewiredPublicOrderOfficeResolver,
    });

    rewiremock.enable();
    app.use(require('../../src/index').api);
  });

  after(() => {
    rewiremock.disable();
  });

  it(
    'should return an HTTP status code 200 (OK) with information on the public order office when the '
      + 'query was successful',
    (done) => {
      supertest(app)
        .get(getEndpoint(mockZipCode))
        .send()
        .expect(StatusCode.SuccessOK)
        .expect(
          {
            public_order_office: {
              name: mockOffice.name,
              email_address: mockOffice.emailAddress,
            },
          },
          done
        );
    }
  );

  it(
    'should return an HTTP status code 400 (Bad Request) when called with invalid zipcode '
      + '(only 4 digits)',
    (done) => {
      supertest(app)
        .get(getEndpoint(mockInvalidZipCode))
        .send()
        .expect(StatusCode.ClientErrorBadRequest)
        .expect({}, done);
    }
  );

  it(
    'should return an HTTP status code 400 (Bad Request) when called with invalid zipcode '
      + '(contains letters)',
    (done) => {
      supertest(app)
        .get(getEndpoint(mockInvalidZipCode2))
        .send()
        .expect(StatusCode.ClientErrorBadRequest)
        .expect({}, done);
    }
  );

  it('should return an HTTP status code 404 (Not Found) when called with a valid but unregistered zipcode', (done) => {
    supertest(app)
      .get(getEndpoint(mockUnknownZipCode))
      .send()
      .expect(StatusCode.ClientErrorNotFound)
      .expect({}, done);
  });
});
