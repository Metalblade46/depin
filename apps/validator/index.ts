import { Keypair } from "@solana/web3.js";
import type { FileSink } from "bun";
import {existsSync, mkdirSync} from 'node:fs'
import type { SignupResponse, ValidationSuccessResponse, ValidatorOutgoing } from "common/types";
import { TransactionFolder } from "./config";
import { saveKeypair } from "./lib/util";

class WebSocketClient {
    private ws: WebSocket | null = null;
    private heartbeatInterval: Timer | null = null;
    private reconnectTimeout: Timer | null = null;
    private isPongReceived: boolean = false;
    private keypair:Keypair|null=null;
    private validatorId: string|null = null;
    private callbacks: Map<string, (data: SignupResponse | ValidationSuccessResponse) => void> = new Map();
    private fileWriter:FileSink|null = null;

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
            this.isPongReceived = true;
            this.startHeartbeat();
            this.createTransactionFile();
        });

        this.ws.addEventListener('message', event => {
            console.log('Received message:', event.data.toString());
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
        await Bun.write(filePath,'TXN    URL    STATUS')
        this.fileWriter = Bun.file(filePath).writer() ;
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
const wsClient = new WebSocketClient('wss://your-websocket-server-url');
// wsClient.connect();
