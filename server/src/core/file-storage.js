const { Storage } = require('@google-cloud/storage')
const uuid = require('uuid')

const EXPIRATION_TIME = 15 * 60 * 1000 // 15 minutes
const BUCKET_NAME = 'weg-li_images'
const DELIMITER = '/'

const storage = new Storage()
const bucket = storage.bucket(BUCKET_NAME)

/**
 * Responsible for calling Google Cloud Storage APIs.
 */
class FileStorage {
    /**
     * Gets a list of all files stored under a specified prefix.
     *
     * @param {String} prefix - A prefix, typically a folder name, which needs to be matched.
     * @returns {Promise<*[string]>} Name of all found files.
     */
    static async listFilesByPrefix(prefix) {
        const options = {
            prefix: prefix[prefix.length - 1] === '/' ? prefix : `${prefix}/`,
            delimiter: DELIMITER
        }

        const [files] = await bucket.getFiles(options)

        return files.map(file => file.name)
    }

    /**
     * Provides a given amount of signed urls stored in specific folder
     * on Google Cloud Storage.
     *
     * @param folderName - Name of folder.
     * @param amount - Number of expected signed urls to create.
     * @returns {Promise<[String]>} Array of signed urls
     * @see {@link generateV4UploadSignedUrl}
     */
    static async generateV4UploadSignedUrls(folderName, amount) {
        const urls = []
        for (let i = 0; i < amount; ++i) {
            const signedUploadUrl = await this.generateV4UploadSignedUrl(`${folderName}/${i.toString()}.jpg`)
            urls.push(signedUploadUrl)
        }
        return urls
    }

    /**
     * Signs a given filename to enable arbitrary users to upload
     * files to a predefined bucket location for a limited time.
     *
     * @param {String} filename - Name of the file.
     * @returns {Promise<string>} Signed Url
     */
    static async generateV4UploadSignedUrl(filename) {
        const options = {
            version: 'v4',
            action: 'write',
            expires: Date.now() + EXPIRATION_TIME,
            contentType: 'image/jpg',
        };
        const [url] = await bucket
            .file(filename)
            .getSignedUrl(options);

        return url
    }

    /**
     * Tries to delete all files identified by the given imageToken
     * parameter.
     *
     * The method throws an error in case the imageToken
     * has no valid format or the deletion process is canceled.
     *
     * @param {String} imageToken - The token follows the structure of an uuid.
     * @returns {Promise<void>}
     * @throws Error
     */
    static async deleteImagesByToken(imageToken) {
        if (!uuid.validate(imageToken)) {
            throw new Error('Invalid image token.')
        }
        try {
            await bucket.deleteFiles({directory: `${imageToken}/`, force: true})
        } catch (error) {
            throw new Error(`Couldn't delete all files linked to the provided image token "${imageToken}".`)
        }
    }

    /**
     * Creates a unique folder name that doesn't exists yet.
     *
     * @returns {Promise<string>} A unique folder name
     */
    static async getUniqueFolderName() {
        let folderName = uuid.v4()
        let files = await FileStorage.listFilesByPrefix(folderName)
        while (files.length !== 0) {
            folderName = uuid.v4()
            files = await FileStorage.listFilesByPrefix(folderName);
        }
        return folderName
    }
}

module.exports = FileStorage
