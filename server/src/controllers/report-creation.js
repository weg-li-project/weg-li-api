'use strict';

/**
 * Controller function for the report creation endpoint.
 *
 * @param {e.Request} request - An express request object.
 * @param {e.Response} response - An express response object.
 */
function createReport(request, response) {
    response.json({value: 'Hello, world!'})
}

module.exports = createReport