const { param } = require('express-validator');
const gaxios = require('gaxios');
const { validate } = require('./assets/validate');

const FileStorage = require('../core/file-storage');
const wrapper = require('./assets/wrapper');

const { IMAGE_ANALYSIS_ENDPOINT } = process.env;

/**
 * Controller function for the image analysis endpoint. Expects a path parameter
 * imageToken. Returns suggestions for license plate and vehicle features.
 *
 * @param {e.Request & { params: { imageToken: string } }} request - An express
 *     request object.
 * @param {e.Response} response - An express response object.
 */
async function getImageAnalysisResults(request, response) {
  const { imageToken } = request.params;

  const fileUrls = await FileStorage.getFileUrlsByToken(imageToken);
  const data = { google_cloud_urls: fileUrls };
  const options = { method: 'POST', url: IMAGE_ANALYSIS_ENDPOINT, data };
  const imagesAnalysisResponse = await gaxios.request(options);
  const suggestions = imagesAnalysisResponse.data;

  response.json(suggestions);
}

const validator = [param('imageToken').exists().isUUID('4'), validate];

module.exports = {
  controller: wrapper(getImageAnalysisResults),
  validator,
};
