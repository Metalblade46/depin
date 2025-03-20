'use client'
import Image from "next/image";
import { Activity, Shield, Clock, Server, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white">
              Monitor Your Services
              <span className="block text-blue-600 dark:text-blue-400">
                With Confidence
              </span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Get real-time insights into your service&apos;s uptime,
              performance, and reliability. Start monitoring in minutes.
            </p>
            <div className="mt-10">
              <button onClick={()=>router.push('/dashboard')} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Start Monitoring Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Real-time Performance Monitoring
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
              Comprehensive analytics and beautiful visualizations for your
              services
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-xl overflow-hidden shadow-lg">
              <Image
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80"
                alt="Analytics Dashboard"
                className="w-full h-[300px] object-cover"
                width={300}
                height={200}
              />
              <div className="p-6 bg-gray-50 dark:bg-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Performance Analytics
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Track response times and performance metrics across all your
                  endpoints
                </p>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg">
              <Image
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
                alt="Uptime Charts"
                className="w-full h-[300px] object-cover"
                width={300}
                height={200}
              />
              <div className="p-6 bg-gray-50 dark:bg-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Uptime Monitoring
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Visual insights into your service availability and uptime
                  statistics
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700">
              <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                99.9% Uptime
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We ensure your services stay online with our reliable monitoring
                system.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700">
              <Clock className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Real-time Alerts
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get instant notifications when your services experience
                downtime.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700">
              <Server className="h-12 w-12 text-blue-600 dark:text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Global Monitoring
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Monitor your services from multiple locations worldwide.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                99.9%
              </div>
              <div className="mt-2 text-gray-600 dark:text-gray-300">
                Average Uptime
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                1.2s
              </div>
              <div className="mt-2 text-gray-600 dark:text-gray-300">
                Response Time
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                24/7
              </div>
              <div className="mt-2 text-gray-600 dark:text-gray-300">
                Monitoring
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="ml-2 text-gray-900 dark:text-white font-semibold">
                DPin Uptime
              </span>
            </div>
            <div className="text-gray-600 dark:text-gray-300">
              © 2025 DPin Uptime. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
