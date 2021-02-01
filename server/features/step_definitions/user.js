const assert = require('assert');
const gaxios = require('gaxios');
const { Then, When, Given } = require('@cucumber/cucumber');

const BASE_URL = 'BASE_URL' in process.env
  ? process.env.BASE_URL
  : 'https://europe-west3-wegli-296209.cloudfunctions.net/api';

Given(/^I created an user account$/, async function () {
  const response = await gaxios.request({
    url: `${BASE_URL}/user`,
    method: 'POST',
  });
  assert.strictEqual(response.status, 200);
  this.user = response.data;
  assert.strictEqual('user_id' in this.user, true);
  assert.strictEqual('access_token' in this.user, true);
});

When(/^I send a deletion request$/, async function () {
  const options = {
    url: `${BASE_URL}/user/${this.user.user_id}`,
    method: 'DELETE',
    headers: { Authorization: `Bearer ${this.user.access_token}` },
  };
  const response = await gaxios.request(options);
  assert.strictEqual(response.status, 200);
});

Then(/^my data should be deleted$/, async () => {});
