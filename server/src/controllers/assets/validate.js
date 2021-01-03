const { validationResult } = require('express-validator');

/**
 * Middleware for extracting express-validator errors. Returns them in a
 * readable format to the client if existent.
 *
 * @param {e.Request} request - Express request object
 * @param {e.Response} response - Express response object
 * @param next - Callback for next middleware
 * @returns
 */
// eslint-disable-next-line consistent-return
function validate(request, response, next) {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    return response.status(400).json({ errors: errors.array() });
  }
  next();
}

module.exports = { validate };
