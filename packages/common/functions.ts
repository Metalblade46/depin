import nacl from 'tweetnacl';
import nacl_util from 'tweetnacl-util';
import bs58 from 'bs58'

export const verifyMessage = (message: string, publicKey: string, signedMessage: string): boolean => {
    // const signedBytes = getBase58Encoder().encode(signedMessage);
    // const decoded = getBase58Decoder().decode(signedBytes);
    // console.log("Signature:", decoded);
    // const verified = await verifySignature(new PublicKey(publicKey) as unknown as CryptoKey, signedBytes as SignatureBytes, getBase58Encoder().encode(message));
    // console.log("Verified:", verified);
    // return verified

    const signedMessageBytes = nacl_util.decodeBase64(signedMessage);
    const verified = nacl.sign.detached.verify(nacl_util.decodeUTF8(message),signedMessageBytes,bs58.decode(publicKey))
    return verified
}

export const generateWithdrawalMessage=(publicKey: string, amount:number)=>{
    return `Requesting ${amount} withdrawal for ${publicKey}`;
}