import { useEffect, useState } from "react";
import { getItems } from "../services/lostItemService";
import { useNavigate } from "react-router-dom";

function ResolvedItems() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await getItems({ status: "resolved" });
      setItems(res.data.items);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Resolved Items</h2>

      {items.length === 0 ? (
        <p className="text-gray-500">No resolved items found</p>
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
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

                  <span className="capitalize">📂 {item.category}</span>

                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold">
                    ✅ Resolved
                  </span>
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
      )}
    </div>
  );
}

export default ResolvedItems;