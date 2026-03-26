import { useEffect, useState } from "react";
import { getItems } from "../services/lostItemService";
import { useNavigate } from "react-router-dom";

function LostFound() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await getItems();
      setItems(res.data.items);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔍 Filter logic (frontend filtering for now)
  const filteredItems = items.filter((item) => {
    return (
      (search === "" ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())) &&
      (category === "" || item.category === category) &&
      (type === "" || item.itemType === type)
    );
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Lost & Found</h2>

      {/* ➕ Add Button */}
      <button
        onClick={() => navigate("/add-item")}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        + Add Item
      </button>

      {/* 🔍 Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search items..."
          className="border p-2 rounded w-1/3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border p-2 rounded"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="documents">Documents</option>
          <option value="accessories">Accessories</option>
          <option value="books">Books</option>
          <option value="clothing">Clothing</option>
          <option value="other">Other</option>
        </select>

        <select
          className="border p-2 rounded"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>
      </div>

      {/* 📦 Items List */}
      <div className="space-y-4">
        {filteredItems.length === 0 && (
          <p className="text-gray-500">No items found</p>
        )}

        {filteredItems.map((item) => (
          <div
            key={item._id}
            onClick={() => navigate(`/item/${item._id}`)}
            className="bg-white p-4 rounded-lg shadow-md border cursor-pointer hover:bg-gray-50"
          >
            <h3 className="text-lg font-semibold">{item.title}</h3>

            <p className="text-gray-600">{item.description}</p>

            <div className="flex gap-4 mt-2 text-sm text-gray-500">
              <span>📍 {item.location}</span>

              <span>
                📅{" "}
                {item.dateOfIncident
                  ? new Date(item.dateOfIncident).toLocaleDateString()
                  : "N/A"}
              </span>

              <span className="font-semibold">
                {item.itemType === "lost" ? "🔴 Lost" : "🟢 Found"}
              </span>

              <span className="capitalize">
                📂 {item.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LostFound;