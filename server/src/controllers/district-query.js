const { StatusCode } = require('status-code-enum');

const wrapper = require('./assets/wrapper');
const { PublicOrderOfficeResolver } = require('../core/public-order-office');

const REQUEST_PARAM_ZIPCODE = 'zipcode';
const ZIPCODE_REGEX = /^\d{5}$/;

/**
 * Validator function for the district query endpoint.
 *
 * @param request {e.Request}
 * @param response {e.Response}
 * @param next {*=}
 */
async function validator(request, response, next) {
  const zipcode = request.params[REQUEST_PARAM_ZIPCODE];

  if (!zipcode.match(ZIPCODE_REGEX)) {
    response.status(StatusCode.ClientErrorBadRequest).end();
    return;
  }

  next();
}

exports.validator = wrapper(validator);

/**
 * Controller function for the district query endpoint.
 *
 * @param request {e.Request}
 * @param response {e.Response}
 */
async function controller(request, response) {
  const zipcode = request.params[REQUEST_PARAM_ZIPCODE];
  const publicOrderOffice = await new PublicOrderOfficeResolver().resolve(
    zipcode
  );

  if (!publicOrderOffice) {
    response.status(StatusCode.ClientErrorNotFound).end();
    return;
  }

  response.status(200).json({
    public_order_office: {
      name: publicOrderOffice.name,
      email_address: publicOrderOffice.emailAddress,
    },
  });
}

exports.controller = wrapper(controller);
