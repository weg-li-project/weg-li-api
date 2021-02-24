const { query } = require('express-validator');
const FileStorage = require('../core/file-storage').shared;
const { validate } = require('./assets/validate');
const wrapper = require('./assets/wrapper');

/**
 * Controller function for the user image upload endpoint. Expects a query
 * parameter quantity. Returns image token and upload urls.
 *
 * @param {e.Request & { query: { quantity: string } }} request - An express
 *     request object.
 * @param {e.Response} response - An express response object.
 */
async function getSignedStorageUrls(request, response) {
  const quantity = parseInt(request.query.quantity);

  const imageToken = await FileStorage.getUniqueImageToken();
  const urls = await FileStorage.getUploadUrls(imageToken, quantity);

  response.json({ token: imageToken, google_cloud_urls: urls });
}

const validator = [
  query('quantity').exists().isInt({ min: 1, max: 5 }),
  validate,
];

module.exports = {
  controller: wrapper(getSignedStorageUrls),
  validator,
};
