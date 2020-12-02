/**
 * An object that encapsulates the error information.
 *
 * @param {String} type - The type of the error.
 * @param {String} description - The human readable description of the error.
 * @returns {{description: String, error: String}}
 * @constructor
 */
function ErrorResponse(type, description) {
    return { error: type, description: description }
}

exports.errors = {
    UNKNOWN_IMAGE_TOKEN: ErrorResponse("unknown_image_token", "The provided image token cannot be resolved.")
}

module.exports = ErrorResponse