const fs = require('fs');
const assert = require('assert');
const gaxios = require('gaxios');
const { Then, When } = require('@cucumber/cucumber');

const BASE_URL = 'BASE_URL' in process.env
  ? process.env.BASE_URL
  : 'https://europe-west3-wegli-296209.cloudfunctions.net/api';

When(/^I send a request for an upload url$/, async function () {
  const options = {
    method: 'GET',
    url: `${BASE_URL}/analyze/image/upload?quantity=1`,
  };
  const response = await gaxios.request(options);
  assert.strictEqual(response.status, 200);
  this.uploadObject = response.data;
  assert.strictEqual('google_cloud_urls' in this.uploadObject, true);
});

When(/^I upload an image$/, { timeout: 60 * 1000 }, async function () {
  const uploadUrl = this.uploadObject.google_cloud_urls[0];
  const options = {
    method: 'PUT',
    url: uploadUrl,
    headers: { 'Content-Type': 'image/jpeg' },
    data: fs.createReadStream(`${__dirname}/../assets/test_image.jpg`),
  };
  const response = await gaxios.request(options);
  assert.strictEqual(response.status, 200);
});

Then(/^I should get an image token$/, function () {
  assert.strictEqual('token' in this.uploadObject, true);
  assert.strictEqual(this.uploadObject.token !== '', true);
});
