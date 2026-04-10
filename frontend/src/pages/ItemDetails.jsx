import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [claim, setClaim] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [claimForm, setClaimForm] = useState({
    name: "",
    studentId: "",
    email: "",
    idCardImage: null,
  });

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
      setClaim(null);
    }
  };

  const handleClaimChange = (e) => {
    const { name, value } = e.target;
    setClaimForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFile = (e) => {
    setClaimForm((prev) => ({
      ...prev,
      idCardImage: e.target.files[0],
    }));
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("itemId", id);
      formData.append("name", claimForm.name);
      formData.append("studentId", claimForm.studentId);
      formData.append("email", claimForm.email);
      formData.append("idCardImage", claimForm.idCardImage);

      await axios.post("http://localhost:5000/api/claims", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Claim submitted! Waiting for admin approval");
      setShowForm(false);
      fetchClaim();
    } catch (err) {
      console.error(err);
      alert("Error submitting claim");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `http://localhost:5000/api/lost-items/${id}/resolve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Item marked as resolved");
      navigate("/lost-found");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to mark item as resolved");
    }
  };

  const renderClaimStatusBadge = () => {
    if (!claim?.status) return null;

    const badgeStyles = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };

    const badgeIcons = {
      pending: "🟡 Pending",
      approved: "🟢 Approved",
      rejected: "🔴 Rejected",
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
          badgeStyles[claim.status] || "bg-gray-100 text-gray-700"
        }`}
      >
        {badgeIcons[claim.status] || claim.status}
      </span>
    );
  };

  if (!item) return <p className="p-6 text-center">Loading...</p>;

  const isFoundItem = item.itemType === "found";
  const isResolved = item.status === "resolved";
  const isApproved = claim?.status === "approved";
  const isPending = claim?.status === "pending";
  const isRejected = claim?.status === "rejected";

  const shouldBlurContact = isFoundItem && !isApproved;

  return (
    <div className="p-6 flex justify-center">
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-4xl">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">{item.title}</h2>

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
                📍 <span className="font-semibold">Location:</span> {item.location}
              </p>
              <p>
                📅 <span className="font-semibold">Date:</span>{" "}
                {new Date(item.dateOfIncident).toLocaleDateString()}
              </p>
              <p>
                📂 <span className="font-semibold">Category:</span> {item.category}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {isFoundItem ? (
                <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-semibold">
                  🟢 Found Item
                </span>
              ) : (
                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                  🔴 Lost Item
                </span>
              )}

              {isFoundItem && renderClaimStatusBadge()}

              {isResolved && (
                <span className="inline-flex items-center bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                  ✅ Resolved
                </span>
              )}
            </div>
          </div>
        </div>

        <hr className="my-6" />

        <div>
          <h3 className="text-xl font-semibold mb-2">📞 Contact Info</h3>

          <div
            className={`bg-gray-50 p-4 rounded-xl ${
              shouldBlurContact ? "blur-sm" : ""
            }`}
          >
            <p>
              📧 <span className="font-medium">Email:</span>{" "}
              {item.contactInfo?.email || "N/A"}
            </p>
            <p>
              📱 <span className="font-medium">Phone:</span>{" "}
              {item.contactInfo?.phone || "N/A"}
            </p>
          </div>

          {isFoundItem && isPending && (
            <p className="text-yellow-600 mt-2">⏳ Waiting for admin approval</p>
          )}

          {isFoundItem && isApproved && !isResolved && (
            <p className="text-green-600 mt-2">
              ✅ Approved! You can contact the owner
            </p>
          )}

          {isFoundItem && isRejected && (
            <p className="text-red-600 mt-2">
              ❌ Your claim was rejected by admin
            </p>
          )}
        </div>

        <div className="mt-6">
          {isFoundItem && !claim && !isResolved && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              This is Mine
            </button>
          )}

          {showForm && (
            <form onSubmit={handleClaimSubmit} className="mt-4 space-y-3">
              <input
                name="name"
                placeholder="Name"
                onChange={handleClaimChange}
                className="border p-2 w-full rounded"
                required
              />

              <input
                name="studentId"
                placeholder="Student ID"
                onChange={handleClaimChange}
                className="border p-2 w-full rounded"
                required
              />

              <input
                name="email"
                placeholder="Email"
                onChange={handleClaimChange}
                className="border p-2 w-full rounded"
                required
              />

              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="border p-2 w-full rounded"
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  Please upload your student ID card photo
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 rounded text-white transition ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit Claim"}
              </button>
            </form>
          )}

          {isApproved && !isResolved && (
            <button
              onClick={handleResolve}
              className="bg-purple-600 text-white px-4 py-2 rounded mt-4"
            >
              Mark as Resolved
            </button>
          )}

          {!isFoundItem && !isResolved && (
            <button
              onClick={handleResolve}
              className="bg-purple-600 text-white px-4 py-2 rounded mt-4"
            >
              Mark as Resolved
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemDetails;