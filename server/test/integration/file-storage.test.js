const assert = require('assert');
const gaxios = require('gaxios');

const fs = require('fs');
const sinon = require('sinon');
const FileStorage = require('../../src/core/file-storage');
const { needsGoogleIntegration } = require('../helpers/skipper');

describe('FileStorage', () => {
  const validImageToken = '21defa36-8370-442b-bac1-95986faba28f';
  const mockBucketReference = {
    getFiles: () => {},
    file: () => ({
      getSignedUrl: () => {},
    }),
    deleteFiles: () => {},
  };

  describe('#constructor', () => {
    it('should create class bucket property', () => {
      const fileStorage = new FileStorage(mockBucketReference);

      assert.strictEqual(fileStorage.bucket, mockBucketReference);
    });
  });

  describe('#getFilesByToken', () => {
    it('should return a list of filenames', async () => {
      sinon
        .stub(mockBucketReference, 'getFiles')
        .returns([[{ name: '0.jpg' }, { name: '1.jpg' }]]);
      const fileStorage = new FileStorage(mockBucketReference);
      const expected = ['0.jpg', '1.jpg'];

      const filenames = await fileStorage.getFilesByToken(validImageToken);

      sinon.assert.calledOnce(mockBucketReference.getFiles);
      assert.deepStrictEqual(filenames, expected);
    });

    afterEach(() => {
      sinon.restore();
    });
  });

  describe('#getUploadUrls', () => {
    it('should call FileStorage#getUploadUrl as often as provided by argument amount', async () => {
      const fileStorage = new FileStorage(mockBucketReference);
      sinon.stub(fileStorage, 'getUploadUrl').returns('');
      const expected = ['', '', ''];

      const urls = await fileStorage.getUploadUrls(validImageToken, 3);

      sinon.assert.calledThrice(fileStorage.getUploadUrl);
      assert.deepStrictEqual(urls, expected);
    });

    afterEach(() => {
      sinon.restore();
    });
  });

  describe('#getUploadUrl', () => {
    it('should return an url as provided by Bucket#file.getSignedUrl', async () => {
      sinon
        .stub(mockBucketReference, 'file')
        .returns({ getSignedUrl: () => ['url'] });
      const fileStorage = new FileStorage(mockBucketReference);
      const expected = 'url';

      const url = await fileStorage.getUploadUrl('');

      assert.deepStrictEqual(url, expected);
    });

    afterEach(() => {
      sinon.restore();
    });
  });

  describe('#deleteImagesByToken', async () => {
    it('should delete all images specified by the given token', async function fun() {
      needsGoogleIntegration(this);

      const fileStorage = FileStorage.shared;
      const filename = `${validImageToken}/test.jpg`;
      const uploadUrl = await fileStorage.getUploadUrl(filename);
      const options = {
        method: 'PUT',
        url: uploadUrl,
        headers: { 'Content-Type': 'image/jpeg' },
        data: fs
          .readFileSync(`${__dirname}/../assets/pixel.jpg`)
          .toString('binary'),
      };
      await gaxios.request(options);
      let files = await fileStorage.getFilesByToken(validImageToken);
      assert.strictEqual(files.length, 1);

      await fileStorage.deleteImagesByToken(validImageToken);

      files = await fileStorage.getFilesByToken(validImageToken);
      assert.strictEqual(files.length, 0);
    });

    it('should throw an error when called with no valid uuid', async () => {
      const fileStorage = new FileStorage(mockBucketReference);

      await assert.rejects(() => fileStorage.deleteImagesByToken(''));
    });

    it('should throw an error when Bucket#deleteFiles throws an error', async () => {
      sinon.stub(mockBucketReference, 'deleteFiles').callsFake(() => {
        throw new Error();
      });
      const fileStorage = new FileStorage(mockBucketReference);

      await assert.rejects(() => fileStorage.deleteImagesByToken(validImageToken));
    });

    it('should call Bucket#deleteFiles once with prefix and force option', async () => {
      sinon.stub(mockBucketReference, 'deleteFiles').callsFake();
      const fileStorage = new FileStorage(mockBucketReference);

      await fileStorage.deleteImagesByToken(validImageToken);

      sinon.assert.calledOnce(mockBucketReference.deleteFiles);
      sinon.assert.calledWith(mockBucketReference.deleteFiles, {
        prefix: `${validImageToken}/`,
        force: true,
      });
    });

    afterEach(() => {
      sinon.restore();
    });
  });

  describe('#deleteImagesByTokens', () => {
    it('should call FileStorage#deleteImagesByToken x time the number of image tokens', async () => {
      const fileStorage = new FileStorage(mockBucketReference);
      sinon.stub(fileStorage, 'deleteImagesByToken').callsFake();
      const imageTokens = ['1', '2', '3'];

      await fileStorage.deleteImagesByTokens(imageTokens);

      sinon.assert.calledThrice(fileStorage.deleteImagesByToken);
    });

    it('should throw an error when FileStorage#deleteImagesByToken throws an error', async () => {
      const fileStorage = new FileStorage(mockBucketReference);
      const imageTokens = ['1', '2', '3'];

      await assert.rejects(() => fileStorage.deleteImagesByTokens(imageTokens));
    });

    afterEach(() => {
      sinon.restore();
    });
  });

  describe('#getUniqueImageToken', () => {
    it('should call FileStorage#getFilesByToken once when it returns an empty array', async () => {
      const fileStorage = new FileStorage(mockBucketReference);
      sinon.stub(fileStorage, 'getFilesByToken').returns([]);

      await fileStorage.getUniqueImageToken();

      sinon.assert.calledOnce(fileStorage.getFilesByToken);
    });

    it('should call FileStorage#getFilesByToken thrice when it returns two times a non-empty array', async () => {
      const fileStorage = new FileStorage(mockBucketReference);
      sinon
        .stub(fileStorage, 'getFilesByToken')
        .onFirstCall()
        .returns([''])
        .onSecondCall()
        .returns([''])
        .onThirdCall()
        .returns([]);

      await fileStorage.getUniqueImageToken();

      sinon.assert.calledThrice(fileStorage.getFilesByToken);
    });

    afterEach(() => {
      sinon.restore();
    });
  });

  describe('#getFileUrlsByToken', () => {
    it('should returns gs uris for every provided image token filename', async () => {
      const filenames = ['0.jpg', '1.jpg', '2.jpg'];
      const expected = [
        'gs://bucket_name/0.jpg',
        'gs://bucket_name/1.jpg',
        'gs://bucket_name/2.jpg',
      ];
      const fileStorage = new FileStorage(mockBucketReference);
      sinon.stub(fileStorage, 'getFilesByToken').returns(filenames);

      const cloudUrls = await fileStorage.getFileUrlsByToken(validImageToken);

      sinon.assert.calledOnce(fileStorage.getFilesByToken);
      assert.deepStrictEqual(cloudUrls, expected);
    });

    it('should throw an error when called with no valid uuid', async () => {
      const fileStorage = new FileStorage(mockBucketReference);

      await assert.rejects(() => fileStorage.getFileUrlsByToken(''));
    });

    afterEach(() => {
      sinon.restore();
    });
  });
});
