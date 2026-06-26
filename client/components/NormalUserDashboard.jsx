"use client";
import { useState, useEffect } from "react";
import { getStores } from "../services/stores";
import { submitRating, updateRating } from "../services/rating";
import toast from "react-hot-toast";

export default function NormalUserDashboard() {
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState({ name: "", address: "" });

  const fetchStores = async () => {
    try {
      const data = await getStores(search);
      setStores(data.stores);
    } catch (error) {
      toast.error("Failed to load stores");
    }
  };

  useEffect(() => {
    fetchStores();
  }, [search]);

  const handleRatingSubmit = async (storeId, rating, isUpdate) => {
    try {
      if (isUpdate) {
        await updateRating(storeId, { rating });
        toast.success("Rating updated successfully");
      } else {
        await submitRating({ storeId, rating });
        toast.success("Rating submitted successfully");
      }
      fetchStores();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit rating");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search by Store Name..."
          className="p-2 border rounded flex-1 dark:bg-zinc-800 dark:border-zinc-700"
          value={search.name}
          onChange={(e) => setSearch({ ...search, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Search by Address..."
          className="p-2 border rounded flex-1 dark:bg-zinc-800 dark:border-zinc-700"
          value={search.address}
          onChange={(e) => setSearch({ ...search, address: e.target.value })}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <div key={store.id} className="p-4 border rounded-xl bg-white dark:bg-zinc-900 shadow-sm">
            <h3 className="font-bold text-lg">{store.name}</h3>
            <p className="text-sm text-gray-500 mb-2">{store.address}</p>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium">Overall: ⭐ {store.overallRating || "N/A"}</span>
              <span className="text-sm font-medium text-blue-600">Your Rating: {store.userRating || "None"}</span>
            </div>
            
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingSubmit(store.id, star, !!store.userRating)}
                  className={`p-2 w-10 h-10 rounded-full font-bold transition-colors ${
                    store.userRating === star ? "bg-yellow-400 text-white" : "bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                  }`}
                >
                  {star}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}