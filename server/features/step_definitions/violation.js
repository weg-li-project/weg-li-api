const assert = require('assert');
const gaxios = require('gaxios');
const { Then, When } = require('@cucumber/cucumber');

const BASE_URL = 'BASE_URL' in process.env
  ? process.env.BASE_URL
  : 'https://europe-west3-wegli-296209.cloudfunctions.net/api';

When(/^I send a request for violation recommendation$/, async function () {
  const data = JSON.stringify({
    user_id: this.user.user_id,
    time: 1605481357079,
    location: {
      latitude: 52.550081,
      longitude: 13.370763,
    },
  });
  const options = {
    url: `${BASE_URL}/analyze/data`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${this.user.access_token}`,
      'Content-Type': 'application/json',
    },
    data,
  };
  const response = await gaxios.request(options);
  assert.strictEqual(response.status, 200);
  this.violationList = response.data;
});

Then(/^I should get a list of violations$/, function () {
  assert.strictEqual(this.violationList.length > -1, true);
});
