import {existsSync, mkdirSync} from 'node:fs'
import { KeypairFolder } from '../config';
import { Keypair } from '@solana/web3.js';
export const saveKeypair = async(keypair:Keypair):Promise<Keypair>=>{
    if (!existsSync(KeypairFolder)){
                mkdirSync(KeypairFolder)
                console.log(`Created ${KeypairFolder} folder.`);
            }
            const privateKey = `[${keypair.secretKey.toString()}]`
    await Bun.write(`${KeypairFolder}/private.txt`,privateKey)
    await Bun.write('./.env',`PRIVATE_KEY=${privateKey}`)
    await Bun.write(`${KeypairFolder}/public.txt`,keypair.publicKey.toBase58());
    return keypair;
}