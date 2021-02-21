const fs = require('fs');
const { Then, When, Given } = require('@cucumber/cucumber');
const assert = require('assert');
const gaxios = require('gaxios');

Given(/^the API url "(.*)"$/, function (url) {
  this.url = this.getAbsoluteUrl(url);
});

Given(/^an user id$/, function () {
  this.url = `${this.url}/${this.context.user_id}`;
});

Given(/^an image token$/, function () {
  this.url = `${this.url}/${this.context.token}`;
});

Given(/^an image upload url$/, function () {
  assert.strictEqual(Array.isArray(this.context.google_cloud_urls), true);
  assert.strictEqual(this.context.google_cloud_urls.length > 0, true);
  this.url = this.context.google_cloud_urls[0];
});

Given(/^the zipcode "(.*)"$/, function (zipcode) {
  this.url = `${this.url}/${zipcode}`;
});

Given(/^a request header "(.*)" with "(.*)"$/, function (name, value) {
  if (!this.headers) this.headers = {};
  this.headers[name] = value;
});

Given(/^a request body with:$/, function (text) {
  const regexVariables = /"{{([A-Za-z_]+)}}"/g;
  const matches = text.matchAll(regexVariables);
  for (const match of matches) {
    text = text.replace(`{{${match[1]}}}`, this.context[match[1]]);
  }
  this.body = text;
});

Given(/^a request body with the file "(.*)"$/, function (filepath) {
  this.body = fs.createReadStream(`${__dirname}/../assets/${filepath}`);
});

When(/^I send a "(.*)" request to the url$/, async function (method) {
  const options = {
    method,
    url: this.url,
    headers: {
      Authorization: this.access_token ? `Bearer ${this.access_token}` : undefined,
      // eslint-disable-next-line no-nested-ternary
      ...this.headers,
    },
    data: this.body ? this.body : undefined,
  };
  this.response = await gaxios.request(options);
});

Then(/^return the status "(.*)"$/, function (status) {
  assert.strictEqual(this.response.status, Number.parseInt(status));
});

Then(/^return a json object with$/, function (table) {
  const body = this.response.data;
  for (const row of table.rows()) {
    assert.strictEqual(row[0] in body, true);
    this.context[row[0]] = body[row[0]];
    this[row[0]] = body[row[0]];
  }
});

Then(/^return a violation json array$/, function () {
  const body = this.response.data;
  assert.strictEqual(Array.isArray(body), true);
  assert.strictEqual(body.length > 0, true);
});
