/**
 * Wraps an Express handler function in a try-catch-block to use Express error handling.
 *
 * @author Lukas Trommer
 * @param handler {function(e.Request, e.Response, *=): Promise<undefined>} The
 *     handler function which should be executed.
 * @returns {function(*=, *=, *=): Promise<undefined>} The wrapped handler function.
 */
module.exports = function (handler) {
  return async function (request, response, next) {
    try {
      await handler(request, response, next);
    } catch (e) {
      next(e);
    }
  };
};
