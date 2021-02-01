const assert = require('assert');
const gaxios = require('gaxios');
const { Then, When } = require('@cucumber/cucumber');

const BASE_URL = 'BASE_URL' in process.env
  ? process.env.BASE_URL
  : 'https://europe-west3-wegli-296209.cloudfunctions.net/api';

When(
  /^I send a request with an image token$/,
  { timeout: 60 * 1000 },
  async function () {
    const options = {
      url: `${BASE_URL}/analyze/image/${this.uploadObject.token}`,
      method: 'GET',
    };
    const response = await gaxios.request(options);
    assert.strictEqual(response.status, 200);
    this.imageAnalysisObject = response.data;
  }
);

Then(
  /^I should get suggestions for license plate number, car color, make and model$/,
  function () {
    assert.strictEqual('suggestions' in this.imageAnalysisObject, true);
    const { suggestions } = this.imageAnalysisObject;
    assert.strictEqual('license_plate_number' in suggestions, true);
    assert.strictEqual(suggestions.license_plate_number[0], 'SXHH');
  }
);
