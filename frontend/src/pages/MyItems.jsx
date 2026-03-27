import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


function MyItems() {
    const navigate = useNavigate();
  const [items, setItems] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchMyItems();
  }, []);

  const fetchMyItems = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/lost-items/my-items",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setItems(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/lost-items/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchMyItems(); // refresh
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  return (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-6">My Activity</h2>

    {items.length === 0 ? (
      <p className="text-gray-500">No items found</p>
    ) : (
      <div className="space-y-6">
        {items.map((item) => (
          <div
            key={item._id}
            className="flex justify-between items-center bg-white p-5 rounded-xl shadow hover:shadow-lg transition"
          >
            {/* LEFT SIDE */}
            <div className="flex-1">
              <h3 className="text-lg font-bold">{item.title}</h3>

              <p className="text-gray-600 mt-1">
                {item.description}
              </p>

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
                    item.itemType === "lost"
                      ? "bg-red-500"
                      : "bg-green-500"
                  }`}
                >
                  {item.itemType === "lost" ? "Lost" : "Found"}
                </span>

                <span className="capitalize">
                  📂 {item.category}
                </span>
              </div>
            </div>

            {/* IMAGE */}
            {item.images && item.images.length > 0 && (
              <img
                src={item.images[0]}
                alt="item"
                className="w-28 h-28 object-cover rounded-lg ml-6 border"
              />
            )}

            {/* ACTION BUTTONS */}
            <div className="flex flex-col gap-2 ml-6">
              <button
                onClick={() => navigate(`/edit-item/${item._id}`)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1 rounded"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(item._id)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
}

export default MyItems;