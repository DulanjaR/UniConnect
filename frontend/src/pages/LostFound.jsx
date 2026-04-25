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
      // Handle both response structures
      const itemsData = Array.isArray(res.data) ? res.data : res.data.items;
      setItems(itemsData || []);
    } catch (err) {
      console.error("Error fetching items:", err);
      setItems([]);
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
      <h2 className="text-2xl font-bold mb-6 text-[#1f2f8a]">Lost & Found</h2>

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
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <input
          type="text"
          placeholder="Search items..."
          className="border p-3 rounded-lg w-full md:w-1/3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border p-3 rounded-lg"
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
          className="border p-3 rounded-lg"
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
          className="border p-3 rounded-lg"
        />

        <input
          type="text"
          placeholder="Filter by location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border p-3 rounded-lg"
        />

        <button
          onClick={() => {
            setSearch("");
            setCategory("");
            setType("");
            setDate("");
            setLocation("");
          }}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg"
        >
          Clear
        </button>
      </div>

      {/* Items */}
      {filteredItems.length === 0 ? (
        <p className="text-gray-500">No items found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              onClick={() => navigate(`/item/${item._id}`)}
              className="bg-white border-[3px] border-gray-200 rounded-[32px] p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer flex flex-col h-full"
            >
              {/* Image */}
              <div className="w-full h-56 rounded-[24px] bg-gray-100 flex items-center justify-center mb-4 border border-gray-200 p-3">
                {item.images && item.images.length > 0 ? (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="max-w-full max-h-full object-contain mx-auto"
                  />
                ) : (
                  <div className="text-gray-400 text-sm">No Image</div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900 capitalize line-clamp-1">
                    {item.title}
                  </h3>

                  <span
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold text-white ${
                      item.itemType === "lost" ? "bg-red-500" : "bg-green-500"
                    }`}
                  >
                    {item.itemType === "lost" ? "Lost" : "Found"}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                  {item.description}
                </p>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p className="line-clamp-1">
                    📍 <span className="font-medium">Location:</span>{" "}
                    {item.location || "N/A"}
                  </p>

                  <p>
                    📅 <span className="font-medium">Date:</span>{" "}
                    {item.dateOfIncident
                      ? new Date(item.dateOfIncident).toLocaleDateString()
                      : "N/A"}
                  </p>

                  <p className="capitalize line-clamp-1">
                    📂 <span className="font-medium">Category:</span>{" "}
                    {item.category}
                  </p>
                </div>

                <div className="mt-auto pt-3 border-t border-gray-100">
                  <span className="text-sm font-medium text-blue-600">
                    View item details →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LostFound;