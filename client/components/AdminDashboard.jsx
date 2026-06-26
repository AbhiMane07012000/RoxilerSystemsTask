"use client";
import { useState, useEffect } from "react";
import { getAdminDashboard, getUsers, createUser } from "../services/admin";
import { getStores, createStore } from "../services/stores";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  

  const [userFilters, setUserFilters] = useState({ name: "", email: "", role: "" });
  
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", address: "", role: "NORMAL_USER" });
  const [newStore, setNewStore] = useState({ name: "", email: "", address: "", ownerId: "" });

  useEffect(() => {
    fetchDashboardStats();
    
    if (activeTab === "users" || activeTab === "stores") {
      fetchUsers();
    }
    
    if (activeTab === "stores") {
      fetchStoresList();
    }
  }, [activeTab, userFilters]);

  const fetchDashboardStats = async () => {
    try {
      const data = await getAdminDashboard();
      setStats(data);
    } catch (error) {
      toast.error("Failed to load dashboard statistics.");
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await getUsers(userFilters);
      setUsers(data);
    } catch (error) {
      toast.error("Failed to load users.");
    }
  };

  const fetchStoresList = async () => {
    try {
      const data = await getStores({});
      setStores(data.stores || []); 
    } catch (error) {
      toast.error("Failed to load stores.");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createUser(newUser);
      toast.success("User created successfully!");
      setNewUser({ name: "", email: "", password: "", address: "", role: "NORMAL_USER" });
      fetchUsers();
      fetchDashboardStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create user");
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    try {
      await createStore({ ...newStore, ownerId: Number(newStore.ownerId) });
      toast.success("Store created successfully!");
      setNewStore({ name: "", email: "", address: "", ownerId: "" });
      fetchStoresList();
      fetchDashboardStats();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create store");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b dark:border-zinc-800 pb-2">
        {["overview", "users", "stores"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize rounded-t-lg transition ${
              activeTab === tab 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm text-center">
            <p className="text-gray-500 dark:text-gray-400 font-medium">Total Users</p>
            <h2 className="text-4xl font-bold text-blue-600 mt-2">{stats.totalUsers}</h2>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm text-center">
            <p className="text-gray-500 dark:text-gray-400 font-medium">Total Stores</p>
            <h2 className="text-4xl font-bold text-green-600 mt-2">{stats.totalStores}</h2>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm text-center">
            <p className="text-gray-500 dark:text-gray-400 font-medium">Total Ratings</p>
            <h2 className="text-4xl font-bold text-yellow-500 mt-2">{stats.totalRatings}</h2>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          <div className="p-6 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold mb-4">Add New User</h3>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Full Name (Min 20 chars)" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500" required />
              <input type="email" placeholder="Email Address" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500" required />
              <input type="password" placeholder="Password (8-16 chars, 1 uppercase, 1 special)" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500" required />
              <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="NORMAL_USER">Normal User</option>
                <option value="STORE_OWNER">Store Owner</option>
                <option value="SYSTEM_ADMIN">System Admin</option>
              </select>
              <textarea placeholder="Address (Max 400 chars)" value={newUser.address} onChange={e => setNewUser({...newUser, address: e.target.value})} className="p-2 border rounded md:col-span-2 dark:bg-zinc-800 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500" required></textarea>
              <button type="submit" className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition">Create User</button>
            </form>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-x-auto">
            <h3 className="text-lg font-bold mb-4">User Directory</h3>
            <div className="flex gap-4 mb-4">
              <input type="text" placeholder="Filter by Name..." value={userFilters.name} onChange={e => setUserFilters({...userFilters, name: e.target.value})} className="p-2 border rounded flex-1 dark:bg-zinc-800 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500" />
              <select value={userFilters.role} onChange={e => setUserFilters({...userFilters, role: e.target.value})} className="p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Roles</option>
                <option value="NORMAL_USER">Normal User</option>
                <option value="STORE_OWNER">Store Owner</option>
                <option value="SYSTEM_ADMIN">System Admin</option>
              </select>
            </div>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b dark:border-zinc-700">
                  <th className="py-2">Name</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Address</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map(user => (
                    <tr key={user.id} className="border-b dark:border-zinc-800">
                      <td className="py-3 font-medium">{user.name}</td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                      <td className="py-3"><span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">{user.role}</span></td>
                      <td className="py-3 text-sm truncate max-w-xs">{user.address}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-gray-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "stores" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="p-6 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold mb-4">Add New Store</h3>
            <form onSubmit={handleCreateStore} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="Store Name" 
                value={newStore.name} 
                onChange={e => setNewStore({...newStore, name: e.target.value})} 
                className="p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-green-500" 
                required 
              />
              <input 
                type="email" 
                placeholder="Store Email" 
                value={newStore.email} 
                onChange={e => setNewStore({...newStore, email: e.target.value})} 
                className="p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-green-500" 
                required 
              />
              
              <select 
                value={newStore.ownerId} 
                onChange={e => setNewStore({...newStore, ownerId: e.target.value})} 
                className="p-2 border rounded dark:bg-zinc-800 dark:border-zinc-700 md:col-span-2 outline-none focus:ring-2 focus:ring-green-500" 
                required
              >
                <option value="" disabled>Select a Store Owner...</option>
                {users.filter(u => u.role === "STORE_OWNER").map(owner => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name} ({owner.email})
                  </option>
                ))}
              </select>

              <textarea 
                placeholder="Store Address (Max 400 chars)" 
                value={newStore.address} 
                onChange={e => setNewStore({...newStore, address: e.target.value})} 
                className="p-2 border rounded md:col-span-2 dark:bg-zinc-800 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-green-500" 
                rows="2"
                required
              ></textarea>
              
              <button 
                type="submit" 
                className="md:col-span-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded transition"
              >
                Create Store
              </button>
            </form>
          </div>

          <div className="p-6 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl shadow-sm overflow-x-auto">
            <h3 className="text-lg font-bold mb-4">Platform Stores</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b dark:border-zinc-700">
                  <th className="py-2">Store Name</th>
                  <th className="py-2">Address</th>
                  <th className="py-2">Overall Rating</th>
                </tr>
              </thead>
              <tbody>
                {stores.length > 0 ? (
                  stores.map(store => (
                    <tr key={store.id} className="border-b dark:border-zinc-800">
                      <td className="py-3 font-medium">{store.name}</td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-400">{store.address}</td>
                      <td className="py-3 font-bold text-yellow-500">⭐ {store.overallRating || "N/A"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-4 text-center text-gray-500">No stores found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}