const ErrorResponse = require("../../core/error-response");

exports.UNKNOWN_IMAGE_TOKEN = ErrorResponse("unknown_image_token",
    "The provided image token cannot be resolved.");
exports.UNKNOWN_PUBLIC_ORDER_OFFICE = ErrorResponse("unknown_public_order_office",
    "There is no public order office registered for the provided zipcode.");