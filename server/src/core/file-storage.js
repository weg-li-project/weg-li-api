const { Storage } = require('@google-cloud/storage');
const uuid = require('uuid');

const EXPIRATION_TIME = 15 * 60 * 1000; // 15 minutes
const BUCKET_NAME = process.env.WEGLI_IMAGES_BUCKET_NAME || 'bucket_name';
const DELIMITER = '/';

const storage = new Storage();
const bucket = storage.bucket(BUCKET_NAME);

/**
 * Responsible for handling any operations necessary for using arbitrary storage
 * solutions specifically meant for file storage.
 *
 * Image tokens are used to identify a group of strictly related images. The
 * image token is in UUID v4 format. Moreover, the image token serves as a
 * folder name on the used storage solution.
 */
class FileStorage {
  constructor(bucketReference) {
    this.bucket = bucketReference;
  }

  /**
   * Gets a list of all files related to the specified image token.
   *
   * @param {String} imageToken - An image token in UUID v4 format.
   * @returns {Promise<string[]>} List of all related files.
   */
  async getFilesByToken(imageToken) {
    const options = {
      prefix: `${imageToken}/`,
      delimiter: DELIMITER,
    };

    const [files] = await this.bucket.getFiles(options);

    return files.map((file) => file.name);
  }

  /**
   * Provides a given amount of upload urls and relates it to the specified imageToken.
   *
   * @param imageToken - An image token in UUID v4 format.
   * @param amount - Number of expected signed urls to create.
   * @see {@link getUploadUrl}
   *
   * @returns {Promise<string[]>} Array of signed urls
   */
  async getUploadUrls(imageToken, amount) {
    const urls = [];
    for (let i = 0; i < amount; i += 1) {
      const signedUploadUrl = this.getUploadUrl(
        `${imageToken}/${i.toString()}.jpg`
      );
      urls.push(signedUploadUrl);
    }
    return Promise.all(urls);
  }

  /**
   * Signs a given filename to enable arbitrary users to upload files to a
   * predefined storage location for a limited amount of time.
   *
   * @param {String} filename - Name of the file.
   * @returns {Promise<string>} Upload url
   */
  async getUploadUrl(filename) {
    const options = {
      version: 'v4',
      action: 'write',
      expires: Date.now() + EXPIRATION_TIME,
      contentType: 'image/jpeg',
    };
    const [url] = await this.bucket.file(filename).getSignedUrl(options);

    return url;
  }

  /**
   * Tries to delete all files identified by the given image tokens.
   *
   * The method throws an error in case the deletion process is canceled.
   *
   * @param imageTokens - A list of image tokens in UUID v4 format.
   * @returns {Promise<void>}
   */
  async deleteImagesByTokens(imageTokens) {
    try {
      await Promise.all(
        imageTokens.map((token) => this.deleteImagesByToken(token))
      );
    } catch (error) {
      throw new Error(
        "Couldn't delete all files linked to the provided image tokens."
      );
    }
  }

  /**
   * Tries to delete all files identified by the given imageToken parameter.
   *
   * The method throws an error in case the imageToken has no valid format or
   * the deletion process is canceled.
   *
   * @param {String} imageToken - An image token in UUID v4 format.
   * @throws {Error}
   * @returns {Promise<void>}
   */
  async deleteImagesByToken(imageToken) {
    if (!uuid.validate(imageToken)) {
      throw new Error('Invalid image token.');
    }
    try {
      await this.bucket.deleteFiles({ prefix: `${imageToken}/`, force: true });
    } catch (error) {
      throw new Error(
        `Couldn't delete all files linked to the provided image token "${imageToken}".`
      );
    }
  }

  /**
   * Creates a unique image token that doesn't exists yet.
   *
   * @returns {Promise<string>} A unique image token
   */
  async getUniqueImageToken() {
    let imageToken = uuid.v4();
    let files = await this.getFilesByToken(imageToken);
    while (files.length !== 0) {
      imageToken = uuid.v4();
      // eslint-disable-next-line no-await-in-loop
      files = await this.getFilesByToken(imageToken);
    }
    return imageToken;
  }

  /**
   * Returns all file urls identified by the provided imageToken.
   *
   * @param imageToken - Image token in UUID v4 format.
   * @throws {Error}
   * @returns {Promise<string[]>} - List of Cloud Storage urls.
   */
  async getFileUrlsByToken(imageToken) {
    if (!uuid.validate(imageToken)) {
      throw new Error('Invalid image token.');
    }
    const cloudStorageUrls = [];
    const fileNames = await this.getFilesByToken(imageToken);
    cloudStorageUrls.push(
      ...fileNames.map((fileName) => `gs://${BUCKET_NAME}/${fileName}`)
    );
    return cloudStorageUrls;
  }
}

FileStorage.shared = new FileStorage(bucket);

module.exports = FileStorage;
