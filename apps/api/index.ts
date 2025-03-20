import express from "express";
import { authMiddleware } from "./middlewares";
import { prismaClient } from 'db/client'
import cors from 'cors'
const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())
app.use(authMiddleware)

app.post('/api/v1/website', async(req, res) => {
    const userId = req.userId;
    const {url} = req.body;

    const data = await prismaClient.website.create({
        data: {
            userId: userId as string,
            url,
        }
    })
    res.json({
        id:data.id
    })

})
app.get('/api/v1/website/status', async (req, res) => {
    const {websiteId} = req.query;
    const userId = req.userId;
    const data = await prismaClient.website.findFirst({
        where: {
            id: websiteId as string,
            userId,
            disabled:false,
            WebsiteTicks:{
                every:{
                    timestamp:{
                        gte: new Date(Date.now()-(30*60*1000))
                    }
                }
            }
        },
        include:{
            WebsiteTicks: true
        }
    })
    res.json(data);
})

app.get('/api/v1/websites', async (req, res) => {
    const {userId} = req;
    const data = await prismaClient.website.findMany({
        where:{
            userId,
            disabled:false,
            // WebsiteTicks:{
            //     every:{
            //         timestamp:{
            //             gte: new Date(Date.now()-(30*60*1000))
            //         }
            //     }
            // }
        },
        include:{
            WebsiteTicks:true,
        },

    }) 
    res.json({
        websites:data
    })

})
app.delete("api/v1/website", async (req, res) => {
    const {websiteId}= req.query;
    const userId = req.userId;
    const data = await prismaClient.website.update({
        where:{
            id:websiteId as string,
            userId
        },
        data:{
            disabled: true
        }
    })
    res.json({
        message: "Website deleted successfully!"
    })
})

app.listen(8080,()=>{
    console.log("Listening on Port 8080")
})