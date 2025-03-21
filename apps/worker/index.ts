import { clusterApiUrl, Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, SendTransactionError } from '@solana/web3.js';
import { Job, Worker } from 'bullmq';
import type { LockingTask, ProcessingTask, UnlockingTask } from 'common/types';
import { prismaClient as db } from 'db/client'
import { ProcessingQueue, UnlockingQueue } from 'queue/client';
import bs58 from 'bs58';

//create a worker for locking

const locker = new Worker('locking', async (job: Job) => {
    const { validatorId, requestedAmount } = job.data as LockingTask;
    const validator = await db.validator.findFirst({ where: { id: validatorId } });
    if (!validator) {
        throw new Error(`Validator with id ${validatorId} not found`); //also not possible, will remove later
    }
    if (validator.locked) //if multiple payments are allowed for the same validator within a small time.
        return;
    if (validator.pendingPayouts < requestedAmount) {
        throw new Error(`Insufficient balance for validator ${validatorId}`); //ideally not possible, just in case
    }
    await db.validator.update({
        where: {
            id: validatorId
        },
        data: {
            locked: true,
            requestedPayouts: requestedAmount
        }
    })
},
    {
        connection: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
        },
    });


locker.on('completed', async (job) => {
    const { validatorId } = job.data as LockingTask;
    const processingQueue = new ProcessingQueue();
    const processingTask: ProcessingTask = {
        validatorId
    }
    processingQueue.addProcessingTask(processingTask);
})
locker.on('failed', async (job, err) => {
    console.log(`Job failed: ${job?.name} with error: ${err.message}`)
})


//create a worker for processing
const processor = new Worker('processing', async (job: Job) => {
    const { validatorId } = job.data as ProcessingTask
    

    const validator = await db.validator.findFirst({ where: { id: validatorId } });
    if (!validator) {
        throw new Error(`Validator with id ${validatorId} not found`); //also not possible, will remove later
    }
    // create keypair 
    const env_private_key = process.env.PRIVATE_KEY;
    if (!env_private_key)
        throw new Error('No private key found!')
    const private_key = JSON.parse(env_private_key);
    //can be array or string, base58
    let keypair = null
    if (Array.isArray(private_key)) {
        keypair = Keypair.fromSecretKey(Uint8Array.from(private_key));
    }
    else {
        try {
            keypair = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(private_key)));
        } catch (error) {
            throw new Error('Invalid private key, provide an array or a base 58 string')
        }
    }
    // send transaction to solana
    const connection = new Connection(process.env.RPC_URL || clusterApiUrl('devnet'));
    const transaction = new Transaction().add(SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: new PublicKey(validator!.publicKey),
        lamports: BigInt(validator!.requestedPayouts) //solana uses lamports
    }))
    let txnSignature
    try{
        txnSignature = await sendAndConfirmTransaction(connection, transaction, [keypair])
        await db.transactions.create({ //Processor has no reattempts if it fails, can result in a double spend
            data: {
                amount: validator.requestedPayouts,
                txnSignature,
                validatorId: validator.id
            }
        })
    }catch(e){
         if (e instanceof SendTransactionError)
            throw new Error(`Transaction failed for ${validatorId}`) //only if txn fails, it will retry else it will log the DB error, which can be handled later
        else console.error(`DB exception occurred for ${validatorId} ${txnSignature} for ${validator.requestedPayouts} lamports`)
    }
    
},
    {
        connection: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
        }
    });

processor.on('completed', async job => {
    const { validatorId } = job.data as ProcessingTask
    const validator = await db.validator.findFirst({
        where: {
            id: validatorId
        }
    })
    const transaction = await db.transactions.findFirst({
        where:{
            validatorId,
            amount: validator!.requestedPayouts,
            status: 'PENDING'
        }
    })
    if (!transaction){
        //must be that the transaction was not registered to the DB
        throw new Error(`No transaction found for validator ${validatorId} and amount ${validator!.requestedPayouts} lamports`)
    }
    const unlockingQueue = new UnlockingQueue();
    await unlockingQueue.addUnlockingTask({validatorId,txnSignature:transaction.txnSignature,retryCount:0})
})
processor.on('failed', async (job, error) => {
    console.log(error,job?.name)
    const { validatorId } = job!.data as ProcessingTask
    new UnlockingQueue().addUnlockingTask({validatorId,txnSignature:undefined,retryCount:5})
})


//create a worker for unlocking
const unlocker = new Worker('unlocking', async (job: Job) => {
    const { txnSignature,retryCount } = job.data as UnlockingTask
    if (!txnSignature)
        throw new Error('No transaction signature')
    // create keypair
    const connection = new Connection(process.env.RPC_URL || clusterApiUrl('devnet'));
    //confirm if the transaction is successful
    const result = await connection.getParsedTransaction(txnSignature, { maxSupportedTransactionVersion: 0 });
    if (!result)
        throw new Error('No transaction')
    if (retryCount> 5 || result.meta?.err)
        throw new Error('Transaction failed')
},
    {
        connection: {
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
        }
    });
unlocker.on('completed', async (job: Job) => {
    const { validatorId, txnSignature } = job.data as UnlockingTask
    const validator = await db.validator.findFirst({
        where: {
            id: validatorId
        }
    })
    const transaction = await db.transactions.findFirst({
        where: {
            validatorId,
            txnSignature
        }
    })
    await db.$transaction([
       db.transactions.update({
        where:{
            id: transaction!.id
        },
        data: {
            status: 'COMPLETED'
        }
       }),
       db.validator.update({
        where:{
            id: validatorId
        },
        data: {
            locked: false,
            requestedPayouts: 0,
            pendingPayouts: {
                decrement: validator?.requestedPayouts
            }
        }
       })
    ])
})

unlocker.on('failed', async (job, error) => {
    const { validatorId, txnSignature, retryCount } = job!.data as UnlockingTask
   if (error.message=='No transaction'){
      //this is a retryable error, so let's retry it
    new UnlockingQueue().addUnlockingTask({validatorId,txnSignature,retryCount:retryCount+1});
   }
   //else unlock the validator making his requested amount to 0
    else{
        console.error(`Failed  transaction for validator ${validatorId} with txnSignature ${txnSignature}. Retry limit reached.`)
        if (txnSignature){
            const validator = await db.validator.findFirst({
                where: {
                    id: validatorId
                }
            })
            const transaction = await db.transactions.findFirst({
                where: {
                    validatorId,
                    txnSignature
                }
            })
            await db.$transaction([
                db.transactions.update({
                 where:{
                     id: transaction!.id
                 },
                 data: {
                     status: 'FAILED'
                 }
                }),
                db.validator.update({
                 where:{
                     id: validatorId
                 },
                 data: {
                     locked: false,
                     requestedPayouts: 0,
                 }
                })
             ])
        }else{
            await db.validator.update({
                where:{
                    id: validatorId
                },
                data: {
                    locked: false,
                    requestedPayouts: 0,
                }
               })
        }
    }
   }
)