import { Keypair } from "@solana/web3.js";
import type { FileSink } from "bun";
import {existsSync, mkdirSync} from 'node:fs'
import type {ValidatorIncoming, ValidatorOutgoing } from "common/types";
import { TransactionFolder } from "./config";
import { getCurrentDateTime, getUrlDetails, saveKeypair, signMessage } from "./lib/util";
import { randomUUIDv7 as v7 } from "bun";

class WebSocketClient {
    private ws: WebSocket | null = null;
    private heartbeatInterval: Timer | null = null;
    private reconnectTimeout: Timer | null = null;
    private isPongReceived: boolean = false;
    private keypair:Keypair|null=null;
    private validatorId: string|null = null;
    private callbacks: Map<string, (data: ValidatorIncoming) => void> = new Map();
    private fileWriter:FileSink|null = null;
    private transactions:number =0

    constructor(
        private url: string,
        private heartbeatIntervalMs: number = 30000,
        private reconnectIntervalMs: number = 5000
    ) {
        // Make the transaction folder and files
        this.createTransactionFolder();
        //Handle the Keypair 
        this.loadKeyPair();
    }

    public connect(): void {
        this.ws = new WebSocket(this.url);
        
        this.ws.addEventListener('open', () => {
            console.log('Connected to WebSocket server');
            this.createTransactionFile();
            this.isPongReceived = true;
            this.startHeartbeat();
            this.signUp();
        });

        this.ws.addEventListener('message', event => {
            const data = JSON.parse(event.data) as ValidatorIncoming;
            console.log(data);
            switch (data.messageType){
                case 'pong':
                    console.log('Pong from Hub!');
                    this.isPongReceived = true;
                    break;
                case 'invalid signature':
                    console.error('Received an invalid signature from the Hub');
                    throw new Error('Invalid signature received from the Hub, Please check your private and public keys and try running Validator again.');
                case'signup':
                    this.handleSignup(data);
                    break;
                case 'validate':
                    this.handleValidation(data);
                    break;
                case 'validation success':
                    this.handleValidationSuccessOrError(data);
                    break;
                case'server error':
                    console.error('Received a server error:', data);
                    this.handleValidationSuccessOrError(data);
                    break;
                default:
                    console.warn('Received unknown message type:', data);
            }
        });

        this.ws.addEventListener('close', async() => {
            this.stopHeartbeat();
            if (this.ws) {
                this.ws.close();
                this.ws = null;
            }
            if(this.fileWriter){
                await this.fileWriter.end();
                this.fileWriter = null;
            }
            this.transactions=0;
            console.log('WebSocket connection closed.');
        });

        this.ws.addEventListener('error', async() => {
            console.error('WebSocket encountered an error');
            if(this.fileWriter){
                await this.fileWriter.end();
                this.fileWriter = null;
            }
            this.stopHeartbeat();
            this.reconnect();
        });
    }
    private handleValidationSuccessOrError(data: ValidatorIncoming) {
        if(data.messageType=='server error' || data.messageType=='validation success')
        this.callbacks.get(data.data.callbackId)?.(data);
    }
    private async handleValidation(data: ValidatorIncoming) {
        if (!this.validatorId) {
            throw new Error('Validator ID is not set. Please signup before validating.');
        }
        if (!this.keypair){
            throw new Error('Keypair is not set. Please generate keypair before validating.');
        }
        if (data.messageType!='validate')
            return;
        const {callbackId,url} = data.data;
        const {latency,status} = await getUrlDetails(url);
        const signature = signMessage("validate",callbackId,this.keypair);
        this.sendMessage({
            messageType: 'validate',
            data: {
                callbackId: data.data.callbackId,
                latency,
                status,
                publicKey: this.keypair.publicKey.toBase58(),
                signature
            }
        });
        this.callbacks.set(callbackId,(data)=>{
            this.fileWriter?.ref();
            switch (data.messageType){
                case 'validation success':
                    this.fileWriter?.write(`${++this.transactions}    ${url}    Successful\n`);
                    break;
                case'server error':
                this.fileWriter?.write(`${++this.transactions}    ${url}    Hub Error\n`);
                    break;
                default:
                    console.warn('Received unknown message type:', data);
            }
        })
    }
    private handleSignup(data: ValidatorIncoming) {
        if(data.messageType!='signup')
            return;
        const {callbackId} = data.data;
        this.callbacks.get(callbackId)?.(data);
    }
    private signUp(){
        if (!this.keypair)
            throw new Error('Keypair is not set. Please generate keypair before signing up.');
        const callbackId = v7();
        const signature = signMessage("signup", callbackId, this.keypair);
        this.sendMessage({
            messageType:'signup',
            data: {
                callbackId,
                publicKey: this.keypair.publicKey.toBase58(),
                signature
            }
        });
        this.callbacks.set(callbackId,(data)=>{
            if(data.messageType=='signup'){
                this.validatorId = data.data.validatorId;
                console.log('Signed up and validated successfully. Your Validator ID:', this.validatorId);
            }else{
                console.error('Received an error from the Hub');
                throw new Error('Error received from the Hub, Please try running Validator later again.');
            }
        })
    }
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                if (!this.isPongReceived) {
                    console.warn('No pong received — assuming connection is dead. Reconnecting...');
                    this.ws.close(); // Force close the connection
                    this.reconnect();
                } else {
                    this.isPongReceived = false; // Reset flag
                    this.sendMessage({messageType:'ping'}); // Send ping as a heartbeat
                    console.log('Ping from Validator');
                }
            }
        }, this.heartbeatIntervalMs);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    private reconnect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        this.reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect...');
            this.connect();
        }, this.reconnectIntervalMs);
    }
    private loadKeyPair(){
        const privateKey = process.env.PRIVATE_KEY;
        if (!privateKey){
            console.warn('No "PRIVATE_KEY" found in the environment. Generating a new one in keys folder.');
            this.keypair = Keypair.generate();
            saveKeypair(this.keypair);
        }else{
            this.keypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(privateKey)));
        }
    }
    private  createTransactionFolder(){
        if (!existsSync(TransactionFolder)){
            mkdirSync(TransactionFolder)
            console.log(`Created ${TransactionFolder} folder.`);
        }
    }
    private async createTransactionFile() {
        const filePath = `${TransactionFolder}/transaction_${Date.now()}.txt`;
        await Bun.write(filePath,'');
        this.fileWriter = Bun.file(filePath).writer() ;
        const date = new Date();
        this.fileWriter.write(`Transactions started at ${getCurrentDateTime()}\nTXN        URL                 STATUS\n`);
        this.fileWriter.unref();
    }
    public sendMessage(data: ValidatorOutgoing): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket is not open. Cannot send message.');
        }
    }

}
// Usage Example
const wsClient = new WebSocketClient('ws://localhost:8081');
wsClient.connect();
