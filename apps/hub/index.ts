import { randomUUIDv7 as v7, type ServerWebSocket } from "bun";
import type { HubIncoming, HubOutgoing, SignUpRequest, SignupResponse, ValidateRequest, ValidateResponse } from 'common/types';
import { prismaClient as db } from "db/client"
import { PublicKey } from "@solana/web3.js";
import nacl from 'tweetnacl';
import nacl_util from 'tweetnacl-util';
import bs58 from 'bs58'

const CALLBACKS = new Map<string, (data: ValidateResponse) => void>();
const availableValidators: { validatorId: string, ws: ServerWebSocket<unknown> }[] = []
const Revenue_per_validation = 100 //lamports

const getLocation = async (ip: string): Promise<string> => {
    const response = await fetch(`https://api.iplocation.net/?ip=${ip}`);
    const data = await response.json();
    return data.country_name || "unknown"
}

const verifyMessage = (message: string, publicKey: string, signedMessage: string): boolean => {
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
const signupHandler = async (ws: ServerWebSocket<unknown>, signupData: SignUpRequest) => {
    try {
        let validator = await db.validator.findFirst({
            where: {
                publicKey: signupData.publicKey
            }
        })
        if (!verifyMessage(`Signed message for ${signupData.callbackId}, ${signupData.publicKey}`, signupData.publicKey, signupData.signature)) {
            sendMessage(ws,{messageType:'invalid signature'})
            return;
        }
        const response: SignupResponse = {
            callbackId: signupData.callbackId,
            validatorId: ""
        }
        if (validator) {
            response.validatorId = validator.id
        } else {
            const data = {
                publicKey: signupData.publicKey,
                ip: ws.remoteAddress,
                location: await getLocation(ws.remoteAddress)
            }
            validator = await db.validator.create({
                data
            })
        }
        response.validatorId = validator.id;
        availableValidators.push({
            validatorId: validator.id,
            ws
        })
        sendMessage(ws,{messageType:'signup',data:response});
    } catch (error) {
        console.log(error);
        sendMessage(ws,{messageType:'server error',data:{callbackId:signupData.callbackId}})
    }
    
}

const validateHandler = async (validateData: ValidateResponse, websiteId: string, validatorId: string, ws: ServerWebSocket<unknown>) => {
    const { callbackId, latency, signature, status, publicKey } = validateData;
    const verified = verifyMessage(`Reply for ${callbackId} ${publicKey}`, publicKey, signature);
    if (!verified) {
        sendMessage(ws,{messageType:'server error',data:{callbackId}})
        return;
    }
    try{

        await db.$transaction([
            db.websiteTicks.create({
                data: {
                    status,
                    timestamp: new Date(),
                    latency,
                    validatorId,
                    websiteId
                }
            }),
            db.validator.update({
                where: {
                    id: validatorId
                },
                data: {
                    pendingPayouts: {
                        increment: Revenue_per_validation
                    }
                }
            })
        ])
    }catch(e){
        console.log(e)
        throw(e)
    }
}

const sendMessage = (ws:ServerWebSocket<unknown>,data:HubOutgoing)=>{
    console.log('Outgoing-',data);
    ws.send(JSON.stringify(data));
}
const sendMessageAndRegisterCallback = (validator: { validatorId: string, ws: ServerWebSocket<unknown> }, website: {
    id: string;
    url: string;
    userId: string;
    disabled: boolean;
}) => {
    const message: ValidateRequest = {
        callbackId: v7(),
        url: website.url
    }
    sendMessage(validator.ws,{messageType:'validate',data:message})
    CALLBACKS.set(message.callbackId, async (data: ValidateResponse) => {
        try {
        await validateHandler(data, website.id, validator.validatorId, validator.ws);
        if (validator.ws.readyState == WebSocket.OPEN)
            sendMessage(validator.ws,{messageType:'validation success',data:{callbackId:message.callbackId}})
        } catch (error) {
            if (validator.ws.readyState == WebSocket.OPEN)
                sendMessage(validator.ws,{messageType:'server error',data:{callbackId:message.callbackId}})
        }finally{
            CALLBACKS.delete(data.callbackId);
        }
    })
}

const sendValidationRequests = async () => {
    if (!availableValidators.length)
        return;
    try {
         //get all websites to monitor
    const websites = await db.website.findMany({
        where: {
            disabled: false
        }
    })
    const totalWebsites = websites.length;
    const totalValidators = availableValidators.length;
    const websitePerValidator = Math.floor(totalWebsites / totalValidators)
    //case when websites lesser than validator, send random
    if (websitePerValidator < 1) {
        const tempValidators = structuredClone(availableValidators);
        while (websites.length) {
            const index = Math.floor(Math.random() * tempValidators.length);
            const validator = tempValidators[index];
            sendMessageAndRegisterCallback(validator, websites[0])
            tempValidators.splice(index, 1); // to avoid same validator getting multiple validation requests
            websites.shift();
        }
    } else {
        //distribute websites among each
        for (let i = 0; i < availableValidators.length; i++) {
            if (!websites.length) break;

            const validator = availableValidators[i];

            for (let j = 0; j < websitePerValidator; j++) {
                const randWebIndex = Math.floor(Math.random() * websites.length);
                sendMessageAndRegisterCallback(validator, websites[randWebIndex])
                websites.splice(randWebIndex, 1);
            }

        }

    }
    } catch (error) {
        console.log('Server error: ',error);
    }
   

}

const server = Bun.serve({
    fetch(req, server) {
        // upgrade the request to a WebSocket
        if (server.upgrade(req)) {
            return; // do not return a Response
        }
        return new Response("Upgrade failed", { status: 500 });
    },
    port: 8081,
    websocket: {
        message: async (ws: ServerWebSocket<unknown>, message: string) => {
            const data = JSON.parse(message) as HubIncoming
            console.log(`Incoming-`,data);
            if (data.messageType == 'ping')
                sendMessage(ws,{messageType:'pong'});
            else if (data.messageType == 'signup') {
                signupHandler(ws, data.data)
            } else {
                const cb = CALLBACKS.get(data.data.callbackId);
                if (cb) cb(data.data);
            }
        },
        close: (ws: ServerWebSocket<unknown>) => {
            availableValidators.splice(availableValidators.findIndex(v => v.ws == ws), 1)
        }
    },
});
console.log(`Listening on ${server.hostname}:${server.port}`);

setInterval(sendValidationRequests, 1000 * 60);