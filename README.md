# Encryption-Decryption

## Data Encryption
The HIU (Health Information User) follows the following steps when creating a data request and performing data encryption for HDCM (Health Data Consent Manager) client:

1. Creates a set of Elliptic-curve Diffie–Hellman (ECDH) parameters: ECDH is a key exchange algorithm that allows two parties to establish a shared secret over an insecure communication channel. The HIU generates the necessary parameters for this algorithm.

2. Generates an ECDH key pair (dhsk(U), dhpk(U)): The HIU generates a short-term public-private key pair specific to the client (U). The private key, dhsk(U), is kept secret and is used for decryption, while the public key, dhpk(U), is shared with other parties involved in the encryption process.

3. Generates a 32-byte random value, rand(U) (nonce): A nonce is a random value used only once. The HIU generates a 32-byte random value specifically for this data request. It serves as a nonce, ensuring that each encryption process is unique.

4. Once the HIU has generated the necessary values (ECDH key pair and nonce), it sends these values along with the data request to HDCM using a digitally-signed API call. The digital signature helps ensure the authenticity and integrity of the request.

5. HDCM, upon receiving the request, verifies the digital signature to ensure that the request originated from the HIU and that it has not been tampered with during transit. This verification process helps prevent unauthorized modifications to the request.

6. After validating the digital signature, HDCM forwards the request to the HIP (Health Information Provider) through another digitally-signed API call. The digital signature is applied to this call as well, providing assurance of the request's authenticity and integrity during transmission to the HIP.

7. By utilizing digital signatures in the API calls, the HDCM and HIP can verify the identity of the sender, detect any unauthorized modifications, and establish a chain of trust throughout the data request process. This helps maintain the security and trustworthiness of the communication between the different entities involved in the HDCM system.


Upon receiving the data request from HDCM, the HIP (Health Information Provider) performs the following steps if the consent artifact is valid and the requested data aligns with the terms of the artifact:

8. Generates a fresh ECDH public-private key pair in the same group as specified by the HIU: The HIP generates a new set of ECDH parameters, including a public key (dhpk(P)) and a private key (dhsk(P)). These parameters are generated in the same elliptic curve group as specified by the HIU, ensuring compatibility for the key exchange process.

9. Generates a 32-byte random value, rand(P) (nonce): Similar to the HIU, the HIP generates a random value, also known as a nonce, specifically for this data exchange. The nonce helps ensure uniqueness and adds an additional layer of security to the encryption process.

10. Computes an ECDH shared key, dhk(U,P): The HIP computes a shared key using its private key (dhsk(P)) and the public key provided by the HIU (dhpk(U)). The ECDH algorithm allows both parties to independently compute the same shared key, which will be used for further encryption.

11. Computes a 256-bit session key, sk(U,P): Using the computed shared key (dhk(U,P)) and the private key of the HIP (dhsk(P)), the HIP derives a session key. This session key is a 256-bit value used specifically for encrypting the data to be sent from the HIP to the HIU.

12. HIP sends the public key dhpk(P), the nonce rand(P), and the encrypted data to the HIU: The HIP sends the public key generated in step 1 (dhpk(P)), the nonce generated in step 2 (rand(P)), and the requested data encrypted using the session key (sk(U,P)) to the HIU. The encryption ensures the confidentiality and integrity of the data during transit.

By following these steps, the HIP establishes a secure communication channel with the HIU, generates session keys for encryption, and sends the encrypted data along with the necessary parameters to fulfill the data request securely.



### Steps for encrypting the data

To encrypt the data using the session key derived from the shared secret key (dh(U, P)), both the HIP and HIU follow the following steps:

1. XOR the nonce (HIP and HIU): Both the HIP and HIU perform an XOR operation between their respective nonces generated earlier. This helps introduce randomness and strengthens the encryption process.

2. Take the first 20 bytes as the salt for HKDF: The resulting XORed value from the previous step is used as the input salt for the HKDF (HMAC-based Key Derivation Function) algorithm. HKDF is a key derivation function that derives a secure encryption key from the input keying material and salt.

3. Derive the key using HKDF (shared key, salt): The shared key obtained from the previous steps and the salt generated from the XORed value are used as inputs to the HKDF algorithm. This generates a derived key, which is used as the encryption key.

4. Encrypt the data using AES GCM (Galois/Counter Mode)

    1. XOR the nonce: The HIP and HIU perform another XOR operation, this time using the nonce values.

    2. Take the last 12 bytes as the IV for GCM: The resulting XORed value is used as the initialization vector (IV) for the AES-GCM encryption algorithm. The IV helps ensure uniqueness and randomness in the encryption process.

    3. Encrypt the data: Using the derived encryption key and the IV, the data is encrypted using the AES-GCM encryption algorithm. AES-GCM provides authenticated encryption, ensuring both confidentiality and integrity of the data.

By following these steps, both the HIP and HIU derive a session key, encrypt the data using AES-GCM, and ensure the confidentiality and integrity of the encrypted data.


## Data decryption

To decrypt the data received by the HIU, the following process is applied:

1. HIU receives the encrypted data along with the key material: The HIU receives the encrypted data from the HIP, which includes the necessary key material. This key material consists of the public key of the HIP (dhpk(P)) and the nonce.

2. HIU queries stored data and retrieves the key material it created during the data flow request: The HIU retrieves the previously stored key material that was generated when it initiated the data flow request. This key material includes the private key of the HIU (dhsk(U)).

3. Computes an ECDH shared key, dhk(U,P): Using the public key of the HIP (dhpk(P)) and the private key of the HIU (dhsk(U)), the HIU computes the same shared key (dhk(U,P)) that was computed by the HIP during encryption. This shared key is derived using the ECDH algorithm.

4. Computes a 256-bit session key, sk(U,P): Similar to the HIP, the HIU computes a session key (sk(U,P)) using the computed shared key (dhk(U,P)), the public key of the HIP (dhpk(P)), and the private key of the HIU (dhsk(U)). This session key is used for decrypting the received data.

After performing these steps, the HIU has derived the same shared key and session key as the HIP did during encryption. These keys are used to decrypt the received data and restore it to its original form. The shared key and session key ensure that only the intended recipient (HIU) can decrypt and access the data sent by the HIP.

