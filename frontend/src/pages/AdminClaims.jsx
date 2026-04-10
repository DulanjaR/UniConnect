import { useEffect, useState } from "react";
import axios from "axios";

function AdminClaims() {
  const [claims, setClaims] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/claims", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Show only pending claims in admin review
      setClaims(res.data.filter((claim) => claim.status === "pending"));
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (id) => {
    try {
      setUpdatingId(id);

      await axios.put(
        `http://localhost:5000/api/claims/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Show approved state briefly before removing the card
      setClaims((prev) =>
        prev.map((claim) =>
          claim._id === id ? { ...claim, status: "approved" } : claim
        )
      );

      setTimeout(() => {
        setClaims((prev) => prev.filter((claim) => claim._id !== id));
        setUpdatingId(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      alert("Failed to approve claim");
      setUpdatingId(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setUpdatingId(id);

      await axios.put(
        `http://localhost:5000/api/claims/${id}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Show rejected state briefly before removing the card
      setClaims((prev) =>
        prev.map((claim) =>
          claim._id === id ? { ...claim, status: "rejected" } : claim
        )
      );

      setTimeout(() => {
        setClaims((prev) => prev.filter((claim) => claim._id !== id));
        setUpdatingId(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      alert("Failed to reject claim");
      setUpdatingId(null);
    }
  };

  const getStatusStyle = (status) => {
    if (status === "approved") {
      return "bg-green-100 text-green-700";
    }
    if (status === "rejected") {
      return "bg-red-100 text-red-700";
    }
    return "bg-yellow-100 text-yellow-700";
  };

  const getItemTypeStyle = (type) => {
    if (type === "found") {
      return "bg-green-100 text-green-700";
    }
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="min-h-screen bg-light-beige p-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">
          Admin Claim Review
        </h2>

        {claims.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
            No pending claims found
          </div>
        ) : (
          <div className="space-y-5">
            {claims.map((claim) => (
              <div
                key={claim._id}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition p-5"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Claimant Details */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Claimant Details
                    </h3>

                    <div className="space-y-2 text-gray-700">
                      <p>
                        <span className="font-semibold">Name:</span> {claim.name}
                      </p>
                      <p>
                        <span className="font-semibold">Student ID:</span>{" "}
                        {claim.studentId}
                      </p>
                      <p>
                        <span className="font-semibold">Email:</span> {claim.email}
                      </p>
                      {claim.userId?.name && (
                        <p>
                          <span className="font-semibold">User Account:</span>{" "}
                          {claim.userId.name}
                        </p>
                      )}
                      {claim.userId?.email && (
                        <p>
                          <span className="font-semibold">Account Email:</span>{" "}
                          {claim.userId.email}
                        </p>
                      )}
                      <p>
                        <span className="font-semibold">Status:</span>{" "}
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(
                            claim.status
                          )}`}
                        >
                          {claim.status}
                        </span>
                      </p>
                    </div>

                    <div className="pt-2">
                      <p className="font-semibold text-gray-800 mb-2">
                        Student ID Card
                      </p>

                      {claim.idCardImage ? (
                        <img
                          src={claim.idCardImage}
                          alt="ID Card"
                          className="w-48 h-32 object-cover rounded-lg border shadow-sm"
                        />
                      ) : (
                        <p className="text-gray-500">No ID card uploaded</p>
                      )}
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-gray-800">
                      Claimed Item
                    </h3>

                    {claim.itemId ? (
                      <div className="space-y-2 text-gray-700">
                        <p>
                          <span className="font-semibold">Title:</span>{" "}
                          {claim.itemId.title}
                        </p>
                        <p>
                          <span className="font-semibold">Location:</span>{" "}
                          {claim.itemId.location || "N/A"}
                        </p>
                        <p>
                          <span className="font-semibold">Category:</span>{" "}
                          {claim.itemId.category || "N/A"}
                        </p>
                        <p>
                          <span className="font-semibold">Type:</span>{" "}
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getItemTypeStyle(
                              claim.itemId.itemType
                            )}`}
                          >
                            {claim.itemId.itemType}
                          </span>
                        </p>

                        {claim.itemId.images && claim.itemId.images.length > 0 ? (
                          <img
                            src={claim.itemId.images[0]}
                            alt="Claimed item"
                            className="w-48 h-32 object-cover rounded-lg border shadow-sm mt-2"
                          />
                        ) : (
                          <p className="text-gray-500">No item image</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">Item details not available</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-3">
                        Actions
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Review the submitted details and decide whether to approve
                        or reject the claim.
                      </p>
                    </div>

                    <div className="flex flex-row lg:flex-col gap-3">
                      {updatingId === claim._id ? (
                        <div
                          className={`px-4 py-2 rounded-lg text-center font-semibold transition-all duration-300 ${
                            claim.status === "approved"
                              ? "bg-green-100 text-green-700 border border-green-300"
                              : "bg-red-100 text-red-700 border border-red-300"
                          }`}
                        >
                          {claim.status === "approved"
                            ? "✅ Approved"
                            : "❌ Rejected"}
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleApprove(claim._id)}
                            className="px-4 py-2 rounded-lg text-white font-medium bg-green-600 hover:bg-green-700 transition"
                          >
                            Approve
                          </button>

                          <button
                            onClick={() => handleReject(claim._id)}
                            className="px-4 py-2 rounded-lg text-white font-medium bg-red-600 hover:bg-red-700 transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminClaims;