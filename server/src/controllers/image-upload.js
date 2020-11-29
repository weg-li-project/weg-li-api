'use strict';

const uuid = require('uuid')

const ErrorResponse = require("../core/error-response");
const FileStorage = require('../core/file-storage')

const BUCKET_NAME = 'weg-li_images'
const DELIMITER = '/'

/**
 * Controller function for the user image upload endpoint.
 *
 * @param {e.Request} request - An express request object.
 * @param {e.Response} response - An express response object.
 */
async function getSignedStorageUrls(request, response) {
    if (!request.query.quantity) {
        return response.status(409)
            .json(ErrorResponse('missing_query', 'The quantity query is missing.'))
    }
    const quantity = parseInt(request.query.quantity)
    if (!Number.isInteger(quantity)) {
        return response.status(409)
            .json(ErrorResponse('wrong_quantity', 'The value of the quantity query needs to be an integer.'))
    }
    if (quantity < 1 || quantity > 5) {
        return response.status(409)
            .json(ErrorResponse('wrong_quantity', 'The value of the quantity query is expected to be between 1-5.'))
    }

    let folderName = uuid.v4()
    let urls = []
    try {
        let files = await FileStorage.listFilesByPrefix(folderName, DELIMITER, BUCKET_NAME)
        while (files.length !== 0) {
            folderName = uuid.v4()
            files = await FileStorage.listFilesByPrefix(folderName, DELIMITER, BUCKET_NAME);
        }
        urls = await FileStorage.generateV4UploadSignedUrls(BUCKET_NAME, folderName, quantity)
    } catch (error) {
        return response.status(409)
            .json(ErrorResponse(error.name, error.message))
    }

    response.json({
        token: folderName,
        google_cloud_urls: urls
    });
}

module.exports = getSignedStorageUrls
