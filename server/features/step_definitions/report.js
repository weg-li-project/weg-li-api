const assert = require('assert');
const gaxios = require('gaxios');
const { Then, When } = require('@cucumber/cucumber');

const BASE_URL = 'BASE_URL' in process.env
  ? process.env.BASE_URL
  : 'https://europe-west3-wegli-296209.cloudfunctions.net/api';

When(/^I send a request for report generation$/, async function () {
  const data = JSON.stringify({
    user_id: this.user.user_id,
    report: {
      violation_type: 1,
      time: 1606756404,
      location: {
        latitude: 52.550081,
        longitude: 13.370763,
      },
      image_token: this.uploadObject.token,
    },
    zipcode: 10711,
  });
  const options = {
    url: `${BASE_URL}/report`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${this.user.access_token}`,
      'Content-Type': 'application/json',
    },
    data,
  };
  const response = await gaxios.request(options);
  assert.strictEqual(response.status, 200);
});

Then(/^the report should be created$/, () => {});
