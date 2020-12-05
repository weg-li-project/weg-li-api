const { Storage } = require('@google-cloud/storage')
const uuid = require('uuid')

const EXPIRATION_TIME = 15 * 60 * 1000 // 15 minutes
const BUCKET_NAME = 'weg-li_images'
const DELIMITER = '/'

const storage = new Storage()
const bucket = storage.bucket(BUCKET_NAME)

/**
 * Responsible for handling any operations necessary for
 * using arbitrary storage solutions specifically meant
 * for file storage.
 *
 * Image tokens are used to identify a group of strictly
 * related images. The image token is in UUID v4 format.
 * Moreover, the image token serves as a folder name on
 * the used storage solution.
 */
class FileStorage {
    /**
     * Gets a list of all files related to the specified image token.
     *
     * @param {String} imageToken - An image token in UUID v4 format.
     * @returns {Promise<string[]>} List of all related files.
     */
    static async getFilesByToken(imageToken) {
        const options = {
            prefix: imageToken[imageToken.length - 1] === '/' ? imageToken : `${imageToken}/`,
            delimiter: DELIMITER
        }

        const [files] = await bucket.getFiles(options)

        return files.map(file => file.name)
    }

    /**
     * Provides a given amount of upload urls and relates it to the
     * specified imageToken.
     *
     * @param imageToken - An image token in UUID v4 format.
     * @param amount - Number of expected signed urls to create.
     * @returns {Promise<string[]>} Array of signed urls
     * @see {@link getUploadUrl}
     */
    static async getUploadUrls(imageToken, amount) {
        const urls = []
        for (let i = 0; i < amount; ++i) {
            const signedUploadUrl = await this.getUploadUrl(`${imageToken}/${i.toString()}.jpg`)
            urls.push(signedUploadUrl)
        }
        return urls
    }

    /**
     * Signs a given filename to enable arbitrary users to upload
     * files to a predefined storage location for a limited amount
     * of time.
     *
     * @param {String} filename - Name of the file.
     * @returns {Promise<string>} Upload url
     */
    static async getUploadUrl(filename) {
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
     * Tries to delete all files identified by the given image tokens.
     *
     * The method throws an error in case the deletion process is canceled.
     *
     * @param imageTokens - A list of image tokens in UUID v4 format.
     * @returns {Promise<void>}
     */
    static async deleteImagesByTokens(imageTokens) {
        for (let token of imageTokens) {
            try {
                await this.deleteImagesByToken(token)
            } catch (error) {
                throw new Error(`Couldn't delete all files linked to the provided image tokens.`)
            }
        }
    }

    /**
     * Tries to delete all files identified by the given imageToken
     * parameter.
     *
     * The method throws an error in case the imageToken
     * has no valid format or the deletion process is canceled.
     *
     * @param {String} imageToken - An image token in UUID v4 format.
     * @returns {Promise<void>}
     * @throws {Error}
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
     * Creates a unique image token that doesn't exists yet.
     *
     * @returns {Promise<string>} A unique image token
     */
    static async getUniqueImageToken() {
        let imageToken = uuid.v4()
        let files = await FileStorage.getFilesByToken(imageToken)
        while (files.length !== 0) {
            imageToken = uuid.v4()
            files = await FileStorage.getFilesByToken(imageToken);
        }
        return imageToken
    }

    /**
     * Returns all file urls identified by the provided imageToken.
     *
     * @param imageToken - Image token in UUID v4 format.
     * @returns {Promise<string[]>} - List of Cloud Storage urls.
     * @throws {Error}
     */
    static async getFileUrlsByToken(imageToken) {
        if (!uuid.validate(imageToken)) {
            throw new Error('Invalid image token.')
        }
        const cloudStorageUrls = []
        try {
            const fileNames = await this.getFilesByToken(imageToken)
            cloudStorageUrls.push(...fileNames.map(fileName => `gs://${BUCKET_NAME}/${fileName}`))
        } catch (error) {
            throw error
        }
        return cloudStorageUrls
    }
}

module.exports = FileStorage
