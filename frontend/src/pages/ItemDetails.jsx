import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function ItemDetails() {
  const { id } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    fetchItem();
  }, []);

  const fetchItem = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/lost-items/${id}`);
      setItem(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!item) return <p className="p-6 text-center">Loading...</p>;

  return (
    <div className="p-6 flex justify-center">
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-4xl">

        {/* Title */}
        <h2 className="text-3xl font-bold mb-4 text-gray-800">
          {item.title}
        </h2>

        {/* Main Layout */}
        <div className="flex flex-col md:flex-row gap-6">

          {/* 🖼️ Images */}
          <div className="flex flex-wrap gap-3">
            {item.images && item.images.length > 0 ? (
              item.images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt="item"
                  className="w-40 h-40 object-cover rounded-xl border shadow"
                />
              ))
            ) : (
              <div className="w-40 h-40 flex items-center justify-center bg-gray-100 rounded-xl">
                No Image
              </div>
            )}
          </div>

          {/* 📄 Details */}
          <div className="flex-1 space-y-2 text-gray-700">

            <p className="text-lg">{item.description}</p>

            <div className="mt-3 space-y-1">
              <p>📍 <span className="font-semibold">Location:</span> {item.location}</p>
              <p>📅 <span className="font-semibold">Date:</span> {new Date(item.dateOfIncident).toLocaleDateString()}</p>
              <p>📂 <span className="font-semibold">Category:</span> {item.category}</p>
            </div>

            {/* Status Badge */}
            <div className="mt-3">
              {item.itemType === "lost" ? (
                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                  🔴 Lost Item
                </span>
              ) : (
                <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-semibold">
                  🟢 Found Item
                </span>
              )}
            </div>

          </div>
        </div>

        {/* Divider */}
        <hr className="my-6" />

        {/* 📞 Contact Section */}
        <div>
          <h3 className="text-xl font-semibold mb-2">📞 Contact Info</h3>

          <div className="bg-gray-50 p-4 rounded-xl">
            <p>
              📧 <span className="font-medium">Email:</span>{" "}
              {item.contactInfo?.email || "N/A"}
            </p>
            <p>
              📱 <span className="font-medium">Phone:</span>{" "}
              {item.contactInfo?.phone || "N/A"}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ItemDetails;