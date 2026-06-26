"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

import { getCurrentUser, logoutUser } from "../../services/auth";

import AdminDashboard from "../../components/AdminDashboard";
import StoreOwnerDashboard from "../../components/StoreOwnerDashboard";
import NormalUserDashboard from "../../components/NormalUserDashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData.user);
      } catch (error) {
        // If unauthorized or token expired, redirect to login
        toast.error("Session expired. Please log in again.");
        Cookies.remove("token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      Cookies.remove("token");
      toast.success("Logged out successfully");
      
      
      window.location.href = "/login"; 
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Failed to log out");
      Cookies.remove("token");
      window.location.href = "/login";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 text-gray-700 dark:text-gray-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const displayRole = user?.role?.replace("_", " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || "Normal User";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
      
      <nav className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Store Ratings Platform
          </h1>
          
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{displayRole}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg text-sm font-semibold transition border border-red-200 dark:border-red-800"
            >
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <main className="p-6 md:p-8 max-w-7xl mx-auto">
        
        {/* Render Admin Dashboard */}
        {user?.role === "SYSTEM_ADMIN" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">System Administration</h2>
              <p className="text-gray-600 dark:text-gray-400">Manage platform users, stores, and overall statistics.</p>
            </div>
            <AdminDashboard />
          </div>
        )}

        {user?.role === "STORE_OWNER" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Owner Dashboard</h2>
              <p className="text-gray-600 dark:text-gray-400">Monitor your stores' performance and customer ratings.</p>
            </div>
            <StoreOwnerDashboard />
          </div>
        )}

        {(user?.role === "NORMAL_USER" || !user?.role) && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Explore Stores</h2>
              <p className="text-gray-600 dark:text-gray-400">Search for stores and submit your ratings.</p>
            </div>
            <NormalUserDashboard />
          </div>
        )}

      </main>
    </div>
  );
}