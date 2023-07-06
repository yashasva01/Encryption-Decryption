import crypto from 'crypto';
import {Buffer} from 'buffer';
import * as thisModule from './encryptionAndDecryption';

interface HostKeysType {
  publicKey: string;
  privateKey: string;
}

export function getPublicPrivateKeys(CurveType: any): HostKeysType {
  const {publicKey, privateKey} = crypto.generateKeyPairSync(CurveType, {
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return {publicKey, privateKey};
}

export function generateSharedKey(
  publicKey: string,
  privateKey: string
): string {
  publicKey = publicKey
    .replace(/-----BEGIN PUBLIC KEY-----\n/, '')
    .replace(/-----END PUBLIC KEY-----\n/, '')
    .replace(/\n/g, '');
  privateKey = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----\n/, '')
    .replace(/-----END PRIVATE KEY-----\n/, '')
    .replace(/\n/g, '');

  const BinaryPublicKey = Buffer.from(publicKey, 'base64');
  const BinaryPrivateKey = Buffer.from(privateKey, 'base64');

  const ECDHPublicKey = crypto.createPublicKey({
    key: BinaryPublicKey,
    format: 'der',
    type: 'spki',
  });
  const ECDHPrivateKey = crypto.createPrivateKey({
    key: BinaryPrivateKey,
    format: 'der',
    type: 'pkcs8',
  });

  const sharedKey = crypto.diffieHellman({
    privateKey: ECDHPrivateKey,
    publicKey: ECDHPublicKey,
  });

  return sharedKey.toString('base64');
}

export function generateSessionKey(
  HIUNonce: Buffer,
  HIPNonce: Buffer,
  sharedKey: string
): any {
  const nonce = HIPNonce.map((value, index) => value ^ HIUNonce[index]);
  const salt = nonce.slice(0, 20);
  const info = Buffer.from('session key', 'utf8');
  const hkdfKey = crypto.createHmac('sha256', sharedKey).update(salt).digest();
  const prk = crypto.createHmac('sha256', hkdfKey).update(info).digest();
  const sessionKey = crypto.pbkdf2Sync(prk, salt, 1, 32, 'sha256');
  return sessionKey;
}

export function generateNonce(): string {
  return crypto.randomBytes(32).toString('base64');
}

export function encryptData(
  data: object,
  requestNonce: string,
  requestPublicKey: string,
  hostNonce: string,
  hostKeys: {
    publicKey: string;
    privateKey: string;
  }
): string {
  const dataStr = JSON.stringify(data);
  const hostNonceB = Buffer.from(hostNonce, 'base64');
  // const hostKeys: HostKeysType = getPublicPrivateKeys(curveType);
  const sharedKey = thisModule.generateSharedKey(
    requestPublicKey,
    hostKeys.privateKey
  );
  const sessionKey = thisModule.generateSessionKey(
    Buffer.from(requestNonce, 'base64'),
    hostNonceB,
    sharedKey
  );
  const requestNonceInBuffer = Buffer.from(requestNonce, 'base64');
  const nonce = hostNonceB.map(
    (value, index) => value ^ requestNonceInBuffer[index]
  );
  const IV: Uint8Array = nonce.slice(-12);
  const IVBuffer = Buffer.from(IV);
  const noncestr = hostNonceB.toString('base64');
  const cipher = crypto.createCipheriv('aes-256-gcm', sessionKey, IVBuffer);
  const encryptedData = Buffer.concat([
    cipher.update(dataStr, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const encryptedBuffer = Buffer.concat([IVBuffer, encryptedData, tag]);
  return encryptedBuffer.toString('base64');
}

export function decryptData(
  encryptedData: string,
  responseNonce: string,
  responsePublicKey: string,
  hostNonce: string,
  hostPrivateKey: string
): string {
  // fetch from redis
  // const hostNonce = 'xoqyxhXvLsQIYLXoda/AD73YLpwOEQsVT5cviqnw/Go=';
  const hostNonceB = Buffer.from(hostNonce, 'base64');
  // fetch private key from redis
  const sharedKey = thisModule.generateSharedKey(
    responsePublicKey,
    hostPrivateKey
  );
  const sessionKey = thisModule.generateSessionKey(
    Buffer.from(responseNonce, 'base64'),
    hostNonceB,
    sharedKey
  );
  const requestNonceInBuffer = Buffer.from(responseNonce, 'base64');
  const nonce = hostNonceB.map(
    (value, index) => value ^ requestNonceInBuffer[index]
  );
  const IV: Uint8Array = nonce.slice(-12);
  const IVBuffer = Buffer.from(IV);

  const encryptedBuffer = Buffer.from(encryptedData, 'base64');
  const tag = encryptedBuffer.slice(-16);
  const ciphertext = encryptedBuffer.slice(12, -16);
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    sessionKey.slice(0, 32),
    IVBuffer
  );
  decipher.setAuthTag(tag);
  const decryptedData = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  const decryptedDataStr = decryptedData.toString('utf8');
  return decryptedDataStr;
}

export const generatePairKeysAndNonce = async (curveType: any) => {
  const {publicKey, privateKey} = getPublicPrivateKeys(curveType);
  return {
    nonce: generateNonce(),
    publicKey,
    privateKey,
  };
};

export const calculateCheckSumOfJson = (data: any) => {
  // calcuate MD5 checksum of the data
  const hash = crypto.createHash('md5');
  const checkSum = hash.update(JSON.stringify(data)).digest('hex');
  return checkSum;
};

export default {
  getPublicPrivateKeys,
  generateSharedKey,
  generateSessionKey,
  generateNonce,
  encryptData,
  decryptData,
  generatePairKeysAndNonce,
  calculateCheckSumOfJson,
};
