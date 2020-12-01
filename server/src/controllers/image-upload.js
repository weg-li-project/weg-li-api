'use strict';

const ErrorResponse = require("../core/error-response");
const FileStorage = require('../core/file-storage')

/**
 * Controller function for the user image upload endpoint.
 * Expects a query parameter quantity.
 * Returns image token and upload urls.
 *
 * @param {e.Request & {query: {quantity: string}}} request - An express request object.
 * @param {e.Response} response - An express response object.
 */
async function getSignedStorageUrls(request, response) {
    const quantity = parseInt(request.query.quantity)

    try {
        const imageToken = await FileStorage.getUniqueImageToken()
        const urls = await FileStorage.getUploadUrls(imageToken, quantity)

        response.json({token: imageToken, google_cloud_urls: urls});
    } catch (error) {
        response.status(409).json(ErrorResponse(error.name, error.message))
    }
}

module.exports = getSignedStorageUrls
