import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export type Website= {
  WebsiteTicks: {
      websiteId: string;
      id: string;
      validatorId: string;
      timestamp: Date;
      status: 'Up' | 'Down';
      latency: number;
  }[];
} & {
  id: string;
  url: string;
  userId: string;
  disabled: boolean;
}
type Status= 'Up' | 'Down' | 'Unknown';

type ProcessedWebite = {
  id: string;
  name: string;
  url: string;
  status: Status;
  uptimeHistory: Status[];
  latencies: (number|null)[];
  uptimePercentage: number|null  // true for up, false for down
}
export const processWebsites = (websites: Website[]):ProcessedWebite[]=>{
  return websites.map(website=>{
      const processed:ProcessedWebite = {
        id: website.id,
        name: website.url.split('/')[2],
        url:website.url,
        status: "Unknown",
        latencies:[...Array(10).fill(null)],
        uptimeHistory:[...Array(10).fill("Unknown")],
        uptimePercentage:null
      };
      if(website.WebsiteTicks.length){
        //Aggregating them into 3 minute windows
        for(let i=0;i<10;i++){
          const windowEnd = new Date(Date.now()-(i*3*60*1000));
          const windowStart = new Date(windowEnd.getTime()- (3*60*1000));
          const ticks = website.WebsiteTicks.filter(tick=>{
            const tickTime = new Date(tick.timestamp);
            return windowEnd> tickTime && windowStart<=tickTime;
          })
          let latency = 0;
          ticks.forEach(tick=>{
            if (tick.latency)
              latency+=tick.latency
          })
         
          const upTicks = ticks.filter(tick=>tick.status=="Up").length;
          processed.uptimeHistory[9-i] = ticks.length ==0 ? "Unknown" : upTicks/ticks.length>=0.5 ? "Up" : "Down";
          processed.latencies[9-i] = ticks.length == 0 ? null: latency/ticks.length
        }
        //Calculating overall uptime percentage
        const allTicks =website.WebsiteTicks
        const upTicks = allTicks.filter(tick=>tick.status=="Up").length;
        processed.uptimePercentage = allTicks.length ==0 ? null : parseFloat((upTicks/allTicks.length*100).toFixed(2))
        processed.status = processed.uptimeHistory[9]
        
      }
      return processed
  })
} 