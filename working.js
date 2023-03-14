
const openpgp = require('openpgp');
const fs = require('fs');

(async () => {
    let passphrase = 'super long and hard to guess secret'
    // const { privateKey, publicKey } = await openpgp.generateKey({
    //     type: 'ecc', // Type of the key, defaults to ECC
    //     curve: 'curve25519', // ECC curve name, defaults to curve25519
    //     userIDs: [{ name: 'Jon Smith', email: 'jon@example.com' }], // you can pass multiple user IDs
    //     passphrase: 'super long and hard to guess secret', // protects the private key
    //     format: 'armored' // output key format, defaults to 'armored' (other options: 'binary' or 'object')
    // });
    // console.log('PUBLIC KEY :', publicKey)
    // console.log('PRIVATE KEY :', privateKey)
    let publicKey=fs.readFileSync('gPublicKey.txt','utf-8')
    let privateKey=fs.readFileSync('gPrivateKey.txt','utf-8')
    const armouredPublicKey = await openpgp.readKey({ armoredKey: publicKey });

    const armouredPrivateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privateKey }),
        passphrase
    });

    const data = fs.readFileSync('originalFile.txt','utf-8').toString()
    const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: data }), // input as Message object
        encryptionKeys: armouredPublicKey,
        signingKeys: armouredPrivateKey ,// optional
    });
    console.log({encrypted}); 

    fs.writeFileSync('encryptedFile.pgp',encrypted)

    const encryptedFileContents=fs.readFileSync('encryptedFile.pgp').toString()

    const message = await openpgp.readMessage({
        armoredMessage: encryptedFileContents // parse armored message
    });
    const { data: decrypted, signatures } = await openpgp.decrypt({
        message,
        verificationKeys: armouredPublicKey, // optional
        decryptionKeys: armouredPrivateKey
    });
    console.log({decrypted}); 
    try {
        await signatures[0].verified; 
        console.log('Signature is valid');
    } catch (e) {
        throw new Error('Signature could not be verified: ' + e.message);
    }
})()
