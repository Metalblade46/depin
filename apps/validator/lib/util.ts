import { existsSync, mkdirSync } from 'node:fs'
import { KeypairFolder } from '../config';
import { Keypair } from '@solana/web3.js';
import axios, { AxiosError } from 'axios';
import nacl from "tweetnacl";
import nacl_util from "tweetnacl-util";

type UrlResponse = {
    latency: number;
    status: 'Up' | 'Down';
}

export const saveKeypair = async (keypair: Keypair): Promise<Keypair> => {
    if (!existsSync(KeypairFolder)) {
        mkdirSync(KeypairFolder)
        console.log(`Created ${KeypairFolder} folder.`);
    }
    const privateKey = `[${keypair.secretKey.toString()}]`
    await Bun.write(`${KeypairFolder}/private.txt`, privateKey)
    await Bun.write('./.env', `PRIVATE_KEY=${privateKey}`)
    await Bun.write(`${KeypairFolder}/public.txt`, keypair.publicKey.toBase58());
    return keypair;
}
const generateSignupMessage = (callbackId: string, publicKey: string) => {
    return `Signed message for ${callbackId}, ${publicKey}`
}
const generateValidateReplyMessage = (callbackId: string, publicKey: string) => {
    return `Reply for ${callbackId} ${publicKey}`
}
export const signMessage = (type: 'signup' | 'validate', callbackId: string, keypair: Keypair) => {
    const publicKey = keypair.publicKey.toBase58();
    const message = nacl_util.decodeUTF8(type == 'signup' ? generateSignupMessage(callbackId, publicKey) : generateValidateReplyMessage(callbackId, publicKey));
    const signature = nacl.sign.detached(message,keypair.secretKey);
    return nacl_util.encodeBase64(signature);
}

export const getUrlDetails = async (url: string): Promise<UrlResponse> => {
    const startTime = Date.now();
    const result: UrlResponse = {
        latency: 1000,
        status: 'Down',
    }
    try {
        await axios.get(url);
        const endTime = Date.now();
        result.latency = endTime - startTime;
        result.status = 'Up';
        return result;
    } catch (error) {
        if (error instanceof AxiosError)
            console.log(`Error fetching ${url}`, error.code)
        return result;

    }
}
export function getCurrentDateTime() {
    const now = new Date();

    // Pad single digits with leading zeroes
    const year = now.getFullYear().toString().padStart(4, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are zero indexed
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    // Format: YYYY-MM-DD HH:MM:SS
    const dateTimeString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return dateTimeString;
}