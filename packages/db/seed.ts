import {prismaClient as prisma} from './src'


async function main(){
    // const user = await prisma.user.create({
    //     data: {
    //         id:"1",
    //         email:"test@gmail.com"
    //     }
    // })
    const website =await prisma.website.create({
        data:{
            url:"https://test2.com",
            userId: "1",
        }
    })
    const validator =await prisma.validator.create({
        data:{
            ip:"255.98.222.111",
            location:"New york",
            publicKey: "affmsafmsamflasfasfaf"
        }
    })
    await prisma.websiteTicks.create({
        data:{
            websiteId: website.id,
            status: "Up",
            latency: 56,
            timestamp: new Date(),
            validatorId: validator.id
        }
    })
    await prisma.websiteTicks.create({
        data:{
            websiteId: website.id,
            status: "Up",
            latency: 100,
            timestamp: new Date( Date.now() - 10*60*1000),
            validatorId:validator.id
        }
    })
    await prisma.websiteTicks.create({
        data:{
            websiteId: website.id,
            status: "Down",
            timestamp: new Date( Date.now() - 20*60*1000),
            validatorId:validator.id
        }
    })
}
main().then(async()=>{
    await prisma.$disconnect()
}).catch(async e=>{
    console.error(e);
    await prisma.$disconnect()
})