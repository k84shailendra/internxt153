import { beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'node:crypto';
import { ConfigService } from '../../src/services/config.service';
import { CryptoService } from '../../src/services/crypto.service';
import { ConfigKeys } from '../../src/types/config.types';
import { Keys } from '@internxt/sdk';
import { KeysService } from '../../src/services/keys.service';

describe('Crypto service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('When text is encrypted using crypto secret env, then it can be decrypted back', () => {
    const envEndpoint: { key: keyof ConfigKeys; value: string } = {
      key: 'APP_CRYPTO_SECRET',
      value: crypto.randomBytes(16).toString('hex'),
    };
    const textToEncrypt = crypto.randomBytes(16).toString('hex');

    const spyConfigService = vi.spyOn(ConfigService.instance, 'get').mockReturnValue(envEndpoint.value);

    const textEncrypted = CryptoService.instance.encryptText(textToEncrypt);
    const textDecrypted = CryptoService.instance.decryptText(textEncrypted);
    expect(textDecrypted).to.be.equal(textToEncrypt);
    expect(spyConfigService).toHaveBeenCalledWith(envEndpoint.key);
  });

  it('When text is encrypted using crypto secret env, then it can be decrypted back', () => {
    const envEndpoint: { key: keyof ConfigKeys; value: string } = {
      key: 'APP_CRYPTO_SECRET',
      value: crypto.randomBytes(16).toString('hex'),
    };
    const textToEncrypt = crypto.randomBytes(16).toString('hex');

    const spyConfigService = vi.spyOn(ConfigService.instance, 'get').mockReturnValue(envEndpoint.value);

    const textEncrypted = CryptoService.instance.encryptText(textToEncrypt);
    const textDecrypted = CryptoService.instance.decryptText(textEncrypted);
    expect(textDecrypted).to.be.equal(textToEncrypt);
    expect(spyConfigService).toHaveBeenCalledWith(envEndpoint.key);
  });

  it('When a password is hashed using CryptoProvider, then it is hashed successfully', async () => {
    const envEndpoint: { key: keyof ConfigKeys; value: string } = {
      key: 'APP_CRYPTO_SECRET',
      value: crypto.randomBytes(16).toString('hex'),
    };
    const spyConfigService = vi.spyOn(ConfigService.instance, 'get').mockReturnValue(envEndpoint.value);

    const password = {
      value: crypto.randomBytes(16).toString('hex'),
      salt: crypto.randomBytes(16).toString('hex'),
    };

    const encryptedSalt = CryptoService.instance.encryptText(password.salt);
    const hashedAndEncryptedPassword = await CryptoService.cryptoProvider.encryptPasswordHash(
      password.value,
      encryptedSalt,
    );
    const hashedPassword = CryptoService.instance.decryptText(hashedAndEncryptedPassword);

    const expectedHashedPassword = crypto
      .pbkdf2Sync(password.value, Buffer.from(password.salt, 'hex'), 10000, 256 / 8, 'sha1')
      .toString('hex');

    expect(hashedPassword).to.be.equal(expectedHashedPassword);
    expect(spyConfigService).toHaveBeenCalledWith(envEndpoint.key);
  });

  it('When a password is hashed using passToHash without salt, then it is hashed with a new generated salt', () => {
    const password = crypto.randomBytes(16).toString('hex');

    const hashedPassword = CryptoService.instance.passToHash({ password });

    expect(hashedPassword.hash.length).to.be.equal(64);
    expect(hashedPassword.salt.length).to.be.equal(32);
  });

  it('When auth keys are generated using CryptoProvider, then they are generated using KeysService', async () => {
    const password = crypto.randomBytes(8).toString('hex');
    const keysReturned = {
      privateKeyArmored: crypto.randomBytes(16).toString('hex'),
      privateKeyArmoredEncrypted: crypto.randomBytes(16).toString('hex'),
      publicKeyArmored: crypto.randomBytes(16).toString('hex'),
      revocationCertificate: crypto.randomBytes(16).toString('hex'),
    };

    const keysServiceStub = vi
      .spyOn(KeysService.instance, 'generateNewKeysWithEncrypted')
      .mockResolvedValue(keysReturned);

    const expectedKeys: Keys = {
      privateKeyEncrypted: keysReturned.privateKeyArmoredEncrypted,
      publicKey: keysReturned.publicKeyArmored,
      revocationCertificate: keysReturned.revocationCertificate,
      ecc: {
        privateKeyEncrypted: keysReturned.privateKeyArmoredEncrypted,
        publicKey: keysReturned.publicKeyArmored,
      },
      kyber: {
        privateKeyEncrypted: null,
        publicKey: null,
      },
    };

    const resultedKeys = await CryptoService.cryptoProvider.generateKeys(password);

    expect(expectedKeys).to.be.deep.equal(resultedKeys);
    expect(keysServiceStub).toHaveBeenCalledWith(password);
  });

  /**
   * This test is commented since the CryptoJS library is not available in the project.
   *
   * We migrated from CryptoJS to node:crypto. This test ensures that the new implementation works the same as the old one.
   */
  it('The node:crypto works the same as CryptoJS library', () => {
    /*
    const password = {
      value: crypto.randomBytes(16).toString('hex'),
      salt: crypto.randomBytes(16).toString('hex'),
    };
    const APP_CRYPTO_SECRET = crypto.randomBytes(16).toString('hex');

    // test PBKDF2 - node:crypto equivalent password to hash
    const actualPass = CryptoJS.PBKDF2(password.value, CryptoJS.enc.Hex.parse(password.salt), { keySize: 256 / 32, iterations: 10000 }).toString();
    const expectedPass = crypto.pbkdf2Sync(password.value, Buffer.from(password.salt, 'hex'), 10000, 256 / 8, 'sha1').toString('hex');
    expect(actualPass).to.be.equal(expectedPass);
    expect(CryptoJS.lib.WordArray.random(128 / 8).toString().length).to.be.equal(
      crypto.randomBytes(128 / 8).toString('hex').length,
    );

    // test CryptoJS.AES - node:crypto equivalent encrypt/decrypt
    const cryptoJSEncrypted = CryptoJS.enc.Base64.parse(
      CryptoJS.AES.encrypt(password.value, APP_CRYPTO_SECRET).toString(),
    ).toString(CryptoJS.enc.Hex);
    const textdecrypted = CryptoService.instance.decryptTextWithKey(cryptoJSEncrypted, APP_CRYPTO_SECRET);
    expect(password.value).to.be.equal(textdecrypted);

    const textencrypted = CryptoService.instance.encryptTextWithKey(password.value, APP_CRYPTO_SECRET);
    const cryptoJSdecrypted = CryptoJS.AES.decrypt(
      CryptoJS.enc.Hex.parse(textencrypted).toString(CryptoJS.enc.Base64),
      APP_CRYPTO_SECRET,
    ).toString(CryptoJS.enc.Utf8);
    expect(password.value).to.be.equal(cryptoJSdecrypted);

    const expectedText1 = CryptoService.instance.encryptTextWithKey(password.value, APP_CRYPTO_SECRET);
    const expectedText2 = CryptoService.instance.decryptTextWithKey(expectedText1, APP_CRYPTO_SECRET);
    expect(password.value).to.be.equal(expectedText2);
    */
  });
});
