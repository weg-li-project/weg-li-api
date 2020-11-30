'use strict';

const ErrorResponse = require("../core/error-response");
const FileStorage = require('../core/file-storage')

/**
 * Controller function for the user image upload endpoint.
 *
 * @param {e.Request & {query: {quantity: String}}} request - An express request object.
 * @param {e.Response} response - An express response object.
 */
async function getSignedStorageUrls(request, response) {
    const quantity = parseInt(request.query.quantity)

    try {
        const folderName = await FileStorage.getUniqueFolderName()
        const urls = await FileStorage.generateV4UploadSignedUrls(folderName, quantity)

        response.json({token: folderName, google_cloud_urls: urls});
    } catch (error) {
        response.status(409).json(ErrorResponse(error.name, error.message))
    }
}

module.exports = getSignedStorageUrls
