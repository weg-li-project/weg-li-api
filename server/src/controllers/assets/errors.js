const ErrorResponse = require("../../core/error-response");

exports.UNKNOWN_IMAGE_TOKEN = ErrorResponse("unknown_image_token",
    "The provided image token cannot be resolved.");