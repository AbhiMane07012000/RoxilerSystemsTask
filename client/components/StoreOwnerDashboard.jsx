"use client";
import { useState, useEffect } from "react";
import { getOwnerDashboard, getStoreRatings } from "../services/store-owner";
import toast from "react-hot-toast";

export default function StoreOwnerDashboard() {
  const [stats, setStats] = useState(null);
  const [selectedStoreRatings, setSelectedStoreRatings] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await getOwnerDashboard();
        setStats(data);
      } catch (error) {
        toast.error("Failed to load dashboard");
      }
    };
    fetchDashboard();
  }, []);

  const viewRatings = async (storeId) => {
    try {
      const data = await getStoreRatings(storeId);
      setSelectedStoreRatings(data.ratings);
    } catch (error) {
      toast.error("Failed to fetch ratings for this store");
    }
  };

  if (!stats) return <p>Loading stats...</p>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg text-center">
          <p className="text-sm text-blue-600 dark:text-blue-300">Total Stores</p>
          <h2 className="text-3xl font-bold">{stats.totalStores}</h2>
        </div>
        <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg text-center">
          <p className="text-sm text-green-600 dark:text-green-300">Total Ratings</p>
          <h2 className="text-3xl font-bold">{stats.totalRatings}</h2>
        </div>
        <div className="p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg text-center">
          <p className="text-sm text-yellow-600 dark:text-yellow-300">Average Rating</p>
          <h2 className="text-3xl font-bold">⭐ {stats.overallAverageRating}</h2>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Your Stores</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="py-2">Name</th>
              <th className="py-2">Avg Rating</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {stats.stores.map((store) => (
              <tr key={store.id} className="border-b dark:border-zinc-800">
                <td className="py-2">{store.name}</td>
                <td className="py-2">⭐ {store.averageRating}</td>
                <td className="py-2">
                  <button onClick={() => viewRatings(store.id)} className="text-blue-500 hover:underline">
                    View Ratings
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedStoreRatings.length > 0 && (
        <div className="mt-8 p-4 border rounded-xl bg-gray-50 dark:bg-zinc-900">
          <h3 className="font-bold mb-4">User Ratings for Selected Store</h3>
          <ul className="space-y-2">
            {selectedStoreRatings.map((rating) => (
              <li key={rating.id} className="flex justify-between border-b pb-2">
                <span>{rating.user.name} ({rating.user.email})</span>
                <span className="font-bold text-yellow-500">⭐ {rating.rating}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}