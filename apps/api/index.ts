import express from "express";
import { authMiddleware } from "./middlewares";
import { prismaClient } from 'db/client'
import cors from 'cors'
import type { WithdrawalRequest } from "common/types";
import { generateWithdrawalMessage, verifyMessage } from "common/functions";
import {LockingQueue} from "queue/client"
const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())
app.use(authMiddleware)

app.post('/api/v1/website', async (req, res) => {
    const userId = req.userId;
    const { url } = req.body;

    const data = await prismaClient.website.create({
        data: {
            userId: userId as string,
            url,
        }
    })
    res.json({
        id: data.id
    })

})

app.get('/api/v1/websites', async (req, res) => {
    const { userId } = req;
    const data = await prismaClient.website.findMany({
        where: {
            userId,
            disabled: false,
        },
        include: {
            WebsiteTicks: {
                where: {
                    timestamp: { gte: new Date(Date.now() - 30 * 60 * 1000) }
                }
            }
        }
    })
    res.json({
        websites: data
    })

})
app.delete("api/v1/website", async (req, res) => {
    const { websiteId } = req.query;
    const userId = req.userId;
    const data = await prismaClient.website.update({
        where: {
            id: websiteId as string,
            userId
        },
        data: {
            disabled: true
        }
    })
    res.json({
        message: "Website deleted successfully!"
    })
})

app.post('/api/v1/validator/withdraw', async (req, res) => {
    const { amount, signature, publicKey } = req.body as WithdrawalRequest;

    // check if the validator's public key is registered with the app
    const validator = await prismaClient.validator.findFirst({
        where: {
            publicKey
        }
    })

    if (!validator) {
        res.status(400).json({
            message: "Validator not found!"
        })
        return;
    }
    //check if  the signature is valid
    if (!verifyMessage(generateWithdrawalMessage(publicKey, amount), publicKey, signature)) {
        res.status(400).json({
            message: "Invalid signature!"
        })
        return;
    }
    //check if amount is valid
    if (amount <= 0) {
        res.status(400).json({
            message: "Invalid amount!"
        })
        return;
    }else if (amount>validator.pendingPayouts){
        res.status(400).json({
            message: "Insufficient funds!"
        })
        return;
    }else if (validator.locked){
        res.status(400).json({
            message: "Processing another transaction, please try again in sometime!"
        })
        return;
    }
    else{
        //Lock the withdrawal request
        const queue = new LockingQueue();
        const response = await queue.addLockingTask({
            requestedAmount: amount,
            validatorId:validator.id
        })
        console.log(response);
        res.json({
            message: "Withdrawal request processed successfully! You will be having your funds in your wallet soon!"
        })
    }
    

})
app.listen(8080, () => {
    console.log("Listening on Port 8080")
})