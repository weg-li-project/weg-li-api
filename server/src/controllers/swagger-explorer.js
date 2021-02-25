const fs = require('fs');
const yaml = require('js-yaml');
const swaggerUi = require('swagger-ui-express');
const wrapper = require('./assets/wrapper');

const SWAGGER_SPECIFICATION_FILEPATH = `${__dirname}/../../static/openapi-specification.yaml`;

let swaggerDocument = null;
const lazyLoadSwaggerDocument = () => {
  if (swaggerDocument === null) {
    swaggerDocument = yaml.load(
      fs.readFileSync(SWAGGER_SPECIFICATION_FILEPATH, { encoding: 'utf-8' })
    );
  }
  return swaggerDocument;
};

/**
 * Controller for serving the swagger explorer.
 *
 * @param {e.Request} request - An express request object.
 * @param {e.Response} response - An express response object.
 * @param {function(): object} loadSwaggerDocument - A function that returns a
 *     swagger document.
 */
async function getSwaggerExplorer(request, response) {
  const options = { explorer: true };

  return swaggerUi.setup(lazyLoadSwaggerDocument(), options)(request, response);
}

module.exports = {
  controller: wrapper(getSwaggerExplorer),
};
