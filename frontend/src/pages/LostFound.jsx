import { useEffect, useState } from "react";
import { getItems } from "../services/lostItemService";
import { useNavigate } from "react-router-dom";

function LostFound() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

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

  const filteredItems = items.filter((item) => {
    return (
      item.status !== "resolved" &&
      (search === "" ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())) &&
      (category === "" || item.category === category) &&
      (type === "" || item.itemType === type) &&
      (date === "" ||
        (item.dateOfIncident && item.dateOfIncident.startsWith(date))) &&
      (location === "" ||
        (item.location &&
          item.location.toLowerCase().includes(location.toLowerCase())))
    );
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Lost & Found</h2>

      {/* Top Actions */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => navigate("/add-item")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg shadow"
          >
            + Add Item
          </button>

          <button
            onClick={() => navigate("/my-items")}
            className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2 rounded-lg shadow"
          >
            My Activity
          </button>

          <button
            onClick={() => navigate("/resolved-items")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg shadow"
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Search items..."
          className="border p-2 rounded w-full md:w-1/3"
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

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Filter by location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border p-2 rounded"
        />

        <button
          onClick={() => {
            setSearch("");
            setCategory("");
            setType("");
            setDate("");
            setLocation("");
          }}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded"
        >
          Clear
        </button>
      </div>

      {/* Items */}
      <div className="space-y-6">
        {filteredItems.length === 0 && (
          <p className="text-gray-500">No items found</p>
        )}

        {filteredItems.map((item) => (
          <div
            key={item._id}
            onClick={() => navigate(`/item/${item._id}`)}
            className="flex justify-between items-center bg-white p-5 rounded-xl shadow hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex-1">
              <h3 className="text-lg font-bold">{item.title}</h3>

              <p className="text-gray-600 mt-1">{item.description}</p>

              <div className="flex gap-4 mt-3 text-sm text-gray-500 flex-wrap">
                <span>📍 {item.location}</span>

                <span>
                  📅{" "}
                  {item.dateOfIncident
                    ? new Date(item.dateOfIncident).toLocaleDateString()
                    : "N/A"}
                </span>

                <span
                  className={`px-2 py-1 rounded text-white text-xs ${
                    item.itemType === "lost" ? "bg-red-500" : "bg-green-500"
                  }`}
                >
                  {item.itemType === "lost" ? "Lost" : "Found"}
                </span>

                <span className="capitalize">📂 {item.category}</span>
              </div>
            </div>

            {item.images && item.images.length > 0 && (
              <img
                src={item.images[0]}
                alt="item"
                className="w-32 h-32 object-cover rounded-lg ml-6 border"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default LostFound;