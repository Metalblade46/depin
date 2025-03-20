import { API_BACKEND_URL } from '@/config';
import { Website } from '@/lib/utils';
import { useAuth } from '@clerk/nextjs'
import axios from 'axios';
import { useEffect, useState } from 'react'

const useWebsite = () => {
    const {getToken} = useAuth()
    const [websites,setWebsites] = useState<Website[]>([])
    const refreshWebsites =async ()=>{
        const token = await getToken();
        const  response = await axios.get(`${API_BACKEND_URL}/api/v1/websites`,{
            headers:{
                Authorization: token
            }
        })
        setWebsites(response.data.websites)
    }
    useEffect(()=>{
        refreshWebsites()
        const interval = setInterval(refreshWebsites,10000);
        return ()=>{
            clearInterval(interval)
        }
    },[])
  return {websites,refreshWebsites}
}

export default useWebsite