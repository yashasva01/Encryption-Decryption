const crypto = require("crypto");
const aes256 = require("aes256");

function getPublicPrivateKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("x25519", {
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });
  return { publicKey, privateKey };
}

async function encryptData(data, standards) {
  const HIPNonce = crypto.randomBytes(32);
  console.log("Hip nonce" + "    " + HIPNonce.toString('base64'));
  const HIUNonce = crypto.randomBytes(32);
  console.log("Hiu nonce" + "    " + HIUNonce.toString('base64'));
  // HIU
  const Alice = getPublicPrivateKeys();
  console.log ("Hiu public private key Pair" + "    ", Alice);
  const AlicePublicKey = Alice.publicKey
    .replace(/-----BEGIN PUBLIC KEY-----\n/, "")
    .replace(/-----END PUBLIC KEY-----\n/, "");
  const AlcePrivateKey = Alice.privateKey
    .replace(/-----BEGIN PRIVATE KEY-----\n/, "")
    .replace(/-----END PRIVATE KEY-----\n/, "");
  const AliceBinaryPublicKey = Buffer.from(AlicePublicKey, "base64");
  const AliceBinaryPrivateKey = Buffer.from(AlcePrivateKey, "base64");

  const AliceECDHPublicKey = crypto.createPublicKey({
    key: AliceBinaryPublicKey,
    format: "der",
    type: "spki",
  });

  const AliceECDHPrivateKey = crypto.createPrivateKey({
    key: AliceBinaryPrivateKey,
    format: "der",
    type: "pkcs8",
  });

  // Decode the base64-encoded key data

  //HIP
  const Bob = getPublicPrivateKeys();
  console.log ("Hip public private key Pair" + "    ", Bob);
  const BobPublicKey = Bob.publicKey
    .replace(/-----BEGIN PUBLIC KEY-----\n/, "")
    .replace(/-----END PUBLIC KEY-----\n/, "");
  const BobPrivateKey = Bob.privateKey
    .replace(/-----BEGIN PRIVATE KEY-----\n/, "")
    .replace(/-----END PRIVATE KEY-----\n/, "");

  const BobBinaryPublicKey = Buffer.from(BobPublicKey, "base64");
  const BobBinaryPrivateKey = Buffer.from(BobPrivateKey, "base64");
  const BobECDHPublicKey = crypto.createPublicKey({
    key: BobBinaryPublicKey,
    format: "der",
    type: "spki",
  });
  const BobECDHPrivateKey = crypto.createPrivateKey({
    key: BobBinaryPrivateKey,
    format: "der",
    type: "pkcs8",
  });



  const sharedSecret = crypto.diffieHellman({
    privateKey: BobECDHPrivateKey,
    publicKey: AliceECDHPublicKey,
  });
  const sharedSecret1 = crypto.diffieHellman({
    privateKey: AliceECDHPrivateKey,
    publicKey: BobECDHPublicKey,
  });

  const ss = sharedSecret.toString("base64");
  console.log("This is shared secret", ss);
  const ss1 = ss.toString("base64");
  console.log("This is shared secret", ss1);
  console.log(sharedSecret.toString("base64"));
  console.log(sharedSecret1.toString("base64"));

  console.log(
    sharedSecret.toString("base64") === sharedSecret1.toString("base64")
  );
  if (sharedSecret.toString("base64") === sharedSecret1.toString("base64")) {
    console.log("Shared secret is same");
  } else {
    console.log("Shared secret is not same");
  }

  const nonce = HIPNonce.map((value, index) => value ^ HIUNonce[index]);

  // Derive session key using HKDF
  const salt = nonce.slice(0, 20);
  const info = Buffer.from("session key", "utf8");
  const hkdfKey = crypto
    .createHmac("sha256", sharedSecret)
    .update(salt)
    .digest();
  const prk = crypto.createHmac("sha256", hkdfKey).update(info).digest();
  const sessionKey = crypto.pbkdf2Sync(prk, salt, 1, 32, "sha256");
  console.log("This is session key");
  console.log(sessionKey.toString("base64"));

  const message = "This is a secret message";
  console.log(message);
  const encMessage = aes256.encrypt(sessionKey.toString("base64"), message);
  console.log(encMessage);
  const decMessage = aes256.decrypt(sessionKey.toString("base64"), encMessage);
  console.log(decMessage);

  return HIPNonce.toString("base64");
}

module.exports = {
  encryptData,
};
