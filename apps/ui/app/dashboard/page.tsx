"use client";
import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Globe, Plus } from "lucide-react";
import { Modal } from "../../components/Modal";
import useWebsite from "@/hooks/useWebsite";
import axios from "axios";
import { API_BACKEND_URL } from "@/config";
import { useAuth } from "@clerk/nextjs";
import { processWebsites } from "@/lib/utils";

// Mock data - in a real app, this would come from an API
// const mockWebsites: Website[] = [
//   {
//     id: '1',
//     name: 'Main Website',
//     url: 'https://example.com',
//     status: 'up',
//     uptimeHistory: Array(10).fill(true),
//   },
//   {
//     id: '2',
//     name: 'API Service',
//     url: 'https://api.example.com',
//     status: 'up',
//     uptimeHistory: [...Array(8).fill(true), false, true],
//   },
//   {
//     id: '3',
//     name: 'Documentation',
//     url: 'https://docs.example.com',
//     status: 'down',
//     uptimeHistory: [...Array(5).fill(true), false, false, true, true, false],
//   },
// ];

export default function Dashboard() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWebsiteUrl, setNewWebsiteUrl] = useState("");
  const { websites, refreshWebsites } = useWebsite();
  const { getToken } = useAuth();

  const toggleWebsite = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const processedWebsites = useMemo(
    () => processWebsites(websites),
    [websites]
  );
  const handleAddWebsite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newWebsiteUrl) return;

    const token = await getToken();
    if (!token) return;
    await axios.post(
      `${API_BACKEND_URL}/api/v1/website`,
      {
        url: newWebsiteUrl,
      },
      {
        headers: {
          Authorization: token,
        },
      }
    );
    setNewWebsiteUrl("");
    refreshWebsites();
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Website Monitoring Dashboard
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Website
          </button>
        </div>

        <div className="space-y-4">
          {processedWebsites.map((website) => (
            <div
              key={website.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
            >
              <button
                onClick={() => toggleWebsite(website.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      website.status === "Up"
                        ? "bg-green-500"
                        : website.status === "Unknown"
                          ? "bg-gray-500"
                          : "bg-red-500"
                    }`}
                  />
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {website.name}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {website.url}
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <span
                    className={`text-sm font-medium ${
                      website.uptimePercentage
                        ? website.uptimePercentage >= 99
                          ? "text-green-600 dark:text-green-400"
                          : website.uptimePercentage >= 95
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {website.uptimePercentage &&
                      website.uptimePercentage + " % uptime"}
                  </span>
                  {expandedId === website.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </button>

              {expandedId === website.id && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        Last 30 Minutes Status
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          website.status === "Up"
                            ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                            : website.status == "Unknown"
                              ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                              : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                        }`}
                      >
                        {website.status === "Up"
                          ? "Operational"
                          : website.status}
                      </span>
                    </div>

                    <div className="flex space-x-1">
                      {website.uptimeHistory.map((tick, index) => (
                        <div
                          key={index}
                          className={`flex-1 h-4 rounded ${
                            tick == "Up"
                              ? "bg-green-500 dark:bg-green-600"
                              : tick == "Unknown"
                                ? "bg-gray-500 dark:bg-gray-600"
                                : "bg-red-500 dark:bg-red-600"
                          }`}
                          title={
                            `${30 - index * 3} minutes ago: ${tick} ` +
                            `${website.latencies[index] ? website.latencies[index] + " ms" : ""}`
                          }
                        />
                      ))}
                    </div>

                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>30 minutes ago</span>
                      <span>Now</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setNewWebsiteUrl("");
        }}
        title="Add New Website"
      >
        <form onSubmit={handleAddWebsite} className="space-y-4">
          <div>
            <label
              htmlFor="websiteUrl"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Website URL
            </label>
            <input
              type="url"
              id="websiteUrl"
              value={newWebsiteUrl}
              onChange={(e) => setNewWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setNewWebsiteUrl("");
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm"
            >
              Add Website
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
