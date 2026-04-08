import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function ResolvedItemDetails() {
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [claim, setClaim] = useState(null);

  useEffect(() => {
    fetchItem();
    fetchClaim();
  }, []);

  const fetchItem = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/lost-items/${id}`);
      setItem(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClaim = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/claims/item/${id}`);
      setClaim(res.data);
    } catch (err) {
      console.log("No claim found");
      setClaim(null);
    }
  };

  if (!item) return <p className="p-6 text-center">Loading...</p>;

  return (
    <div className="p-6 flex justify-center">
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-4xl">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">
          {item.title}
        </h2>

        <div className="flex flex-col md:flex-row gap-6">
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

          <div className="flex-1 space-y-2 text-gray-700">
            <p className="text-lg">{item.description}</p>

            <div className="mt-3 space-y-1">
              <p>
                📍 <span className="font-semibold">Location:</span> {item.location || "N/A"}
              </p>
              <p>
                📅 <span className="font-semibold">Date:</span>{" "}
                {item.dateOfIncident
                  ? new Date(item.dateOfIncident).toLocaleDateString()
                  : "N/A"}
              </p>
              <p>
                📂 <span className="font-semibold">Category:</span> {item.category || "N/A"}
              </p>
              <p>
                🏷 <span className="font-semibold">Type:</span> {item.itemType || "N/A"}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                ✅ Resolved
              </span>
            </div>
          </div>
        </div>

        <hr className="my-6" />

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

        {claim && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="text-xl font-semibold mb-3 text-green-700">
              Collector Details
            </h3>

            <div className="space-y-2 text-gray-700">
              <p>
                👤 <span className="font-medium">Name:</span> {claim.name || "N/A"}
              </p>
              <p>
                🆔 <span className="font-medium">Student ID:</span> {claim.studentId || "N/A"}
              </p>
              <p>
                📧 <span className="font-medium">Email:</span> {claim.email || "N/A"}
              </p>
              <p>
                📌 <span className="font-medium">Claim Status:</span>{" "}
                <span className="capitalize">{claim.status || "N/A"}</span>
              </p>

              {claim.idCardImage && (
                <div className="mt-3">
                  <p className="font-medium mb-2">Student ID Card Photo:</p>
                  <img
                    src={claim.idCardImage}
                    alt="Student ID Card"
                    className="w-52 h-36 object-cover rounded-lg border shadow"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResolvedItemDetails;