/**
 * Wraps an Express handler function in a try-catch-block to use Express error handling.
 *
 * @author Lukas Trommer
 * @param handler {function(e.Request, e.Response, *=): Promise<void>} The
 *     handler function which should be executed.
 * @returns {function(*=, *=, *=): Promise<void>} The wrapped handler function.
 */
const wrapper = function (handler) {
  return async function (request, response, next) {
    try {
      await handler(request, response, next);
    } catch (e) {
      next(e);
    }
  };
};

module.exports = wrapper;
