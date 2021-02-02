const assert = require('assert');
const gaxios = require('gaxios');
const { Then, When } = require('@cucumber/cucumber');

const BASE_URL = 'BASE_URL' in process.env
  ? process.env.BASE_URL
  : 'https://europe-west3-wegli-296209.cloudfunctions.net/api';

When(/^I send a zipcode$/, async function () {
  const zipCode = 10711;
  const options = {
    method: 'GET',
    url: `${BASE_URL}/report/district/${zipCode}`,
  };
  const response = await gaxios.request(options);
  assert.strictEqual(response.status, 200);
  this.localAuthority = response.data;
});

Then(
  /^I should get the email address from the corresponding authorities$/,
  function () {
    assert.strictEqual('public_order_office' in this.localAuthority, true);
    const publicOrderOffice = this.localAuthority.public_order_office;
    assert.strictEqual('email_address' in publicOrderOffice, true);
  }
);
