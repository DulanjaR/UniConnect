import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [claim, setClaim] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const [claimForm, setClaimForm] = useState({
    name: "",
    studentId: "",
    email: "",
    idCardImage: null,
  });

  useEffect(() => {
    fetchItem();
    fetchClaim();
    fetchMatches();
  }, [id]);

  const fetchItem = async () => {
    try {
      const res = await axios.get(`${API_URL}/lost-items/${id}`);
      setItem(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchClaim = async () => {
    try {
      const res = await axios.get(`${API_URL}/claims/item/${id}`);
      setClaim(res.data);

      if (res.data?.status === "rejected") {
        setClaimForm({
          name: res.data.name || "",
          studentId: res.data.studentId || "",
          email: res.data.email || "",
          idCardImage: null,
        });
      }
    } catch (err) {
      setClaim(null);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoadingMatches(true);
      const res = await axios.get(`${API_URL}/lost-items/${id}/matches`);
      setMatches(res.data.matches || []);
    } catch (err) {
      console.error("Error fetching matches:", err);
      setMatches([]);
    } finally {
      setLoadingMatches(false);
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

  const handleOpenClaimForm = () => {
    if (claim?.status === "rejected") {
      setClaimForm({
        name: claim.name || "",
        studentId: claim.studentId || "",
        email: claim.email || "",
        idCardImage: null,
      });
    }
    setShowForm(true);
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

      await axios.post(`${API_URL}/claims`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Claim submitted! Waiting for admin approval");
      setShowForm(false);
      setClaimForm({
        name: "",
        studentId: "",
        email: "",
        idCardImage: null,
      });
      fetchClaim();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error submitting claim");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/lost-items/${id}/resolve`,
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
      pending: "bg-yellow-100 text-yellow-700 border border-yellow-200",
      approved: "bg-green-100 text-green-700 border border-green-200",
      rejected: "bg-red-100 text-red-700 border border-red-200",
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

  const getMatchBadgeStyle = (label) => {
    if (label === "High Match") return "bg-green-100 text-green-700 border border-green-200";
    if (label === "Possible Match") return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    return "bg-orange-100 text-orange-700 border border-orange-200";
  };

  if (!item) return <p className="p-6 text-center">Loading...</p>;

  const isFoundItem = item.itemType === "found";
  const isResolved = item.status === "resolved";
  const isApproved = claim?.status === "approved";
  const isPending = claim?.status === "pending";
  const isRejected = claim?.status === "rejected";

  const shouldBlurContact = isFoundItem && !isApproved;
  const canShowClaimButton = isFoundItem && (!claim || isRejected) && !isResolved;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Details Card */}
        <div className="bg-white rounded-[32px] shadow-md border border-slate-200 p-6 md:p-8">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Image Section */}
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-[28px] p-5 shadow-sm">
                <div className="w-full h-[320px] flex items-center justify-center">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt="item"
                      onClick={() => setPreviewImage(item.images[0])}
                      className="max-w-full max-h-full object-contain rounded-2xl cursor-pointer hover:scale-105 transition"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      No Image
                    </div>
                  )}
                </div>
              </div>

              {item.images && item.images.length > 1 && (
                <div className="flex flex-wrap gap-3">
                  {item.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`item-${index}`}
                      onClick={() => setPreviewImage(img)}
                      className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:scale-105 transition"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="space-y-5 min-w-0">
              <div className="min-w-0">
                <h2 className="text-4xl font-bold text-slate-800 mb-3 break-words">
                  {item.title}
                </h2>
                <p className="text-lg text-slate-600 leading-8 break-words break-all max-w-full">
                  {item.description}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-w-0">
                  <p className="text-sm text-slate-400 font-semibold uppercase tracking-wide mb-1">
                    Location
                  </p>
                  <p className="text-lg font-semibold text-slate-700 break-words">
                    📍 {item.location || "N/A"}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-w-0">
                  <p className="text-sm text-slate-400 font-semibold uppercase tracking-wide mb-1">
                    Date
                  </p>
                  <p className="text-lg font-semibold text-slate-700">
                    📅{" "}
                    {item.dateOfIncident
                      ? new Date(item.dateOfIncident).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:col-span-2 min-w-0">
                  <p className="text-sm text-slate-400 font-semibold uppercase tracking-wide mb-1">
                    Category
                  </p>
                  <p className="text-lg font-semibold text-slate-700 capitalize break-words">
                    📂 {item.category}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {isFoundItem ? (
                  <span className="inline-flex items-center bg-green-100 text-green-700 border border-green-200 px-4 py-2 rounded-full text-sm font-semibold">
                    🟢 Found Item
                  </span>
                ) : (
                  <span className="inline-flex items-center bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-full text-sm font-semibold">
                    🔴 Lost Item
                  </span>
                )}

                {isFoundItem && renderClaimStatusBadge()}

                {isResolved && (
                  <span className="inline-flex items-center bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2 rounded-full text-sm font-semibold">
                    ✅ Resolved
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-[28px] shadow-sm border border-slate-200 p-6">
          <h3 className="text-2xl font-bold text-slate-800 mb-4">📞 Contact Info</h3>

          <div
            className={`bg-slate-50 border border-slate-200 p-5 rounded-2xl ${
              shouldBlurContact ? "blur-sm" : ""
            }`}
          >
            <div className="space-y-3 text-slate-700">
              <p className="text-lg break-words">
                📧 <span className="font-semibold">Email:</span>{" "}
                {item.contactInfo?.email || "N/A"}
              </p>
              <p className="text-lg break-words">
                📱 <span className="font-semibold">Phone:</span>{" "}
                {item.contactInfo?.phone || "N/A"}
              </p>
            </div>
          </div>

          {isFoundItem && isPending && (
            <p className="text-yellow-600 mt-3 font-medium">⏳ Waiting for admin approval</p>
          )}

          {isFoundItem && isApproved && !isResolved && (
            <p className="text-green-600 mt-3 font-medium">
              ✅ Approved! You can contact the owner
            </p>
          )}

          {isFoundItem && isRejected && (
            <div className="mt-3">
              <p className="text-red-600 font-medium">
                ❌ Your claim was rejected by admin
              </p>
              <p className="text-slate-500 text-sm mt-1">
                You can review your details and submit a new claim again.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-[28px] shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-2xl font-bold text-slate-800">Actions</h3>
              <p className="text-slate-500 mt-1 break-words">
                Continue with the claim process or mark this item as resolved.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {(isApproved && !isResolved) || (!isFoundItem && !isResolved) ? (
                <button
                  onClick={handleResolve}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-2xl shadow-md font-semibold transition"
                >
                  Mark as Resolved
                </button>
              ) : null}

              {canShowClaimButton && (
                <button
                  onClick={handleOpenClaimForm}
                  className={`text-white px-6 py-3 rounded-2xl shadow-md font-semibold transition ${
                    isRejected
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isRejected ? "Retry Claim" : "This is Mine"}
                </button>
              )}
            </div>
          </div>

          {showForm && (
            <form onSubmit={handleClaimSubmit} className="mt-6 grid md:grid-cols-2 gap-4">
              <input
                name="name"
                placeholder="Name"
                value={claimForm.name}
                onChange={handleClaimChange}
                className="border border-slate-300 p-3 rounded-xl w-full"
                required
              />

              <input
                name="studentId"
                placeholder="Student ID"
                value={claimForm.studentId}
                onChange={handleClaimChange}
                className="border border-slate-300 p-3 rounded-xl w-full"
                required
              />

              <input
                name="email"
                placeholder="Email"
                value={claimForm.email}
                onChange={handleClaimChange}
                className="border border-slate-300 p-3 rounded-xl w-full md:col-span-2"
                required
              />

              <div className="md:col-span-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="border border-slate-300 p-3 rounded-xl w-full"
                  required
                />
                <p className="text-sm text-slate-500 mt-2">
                  Please upload your student ID card photo
                </p>
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-3 rounded-2xl text-white font-semibold transition ${
                    isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 shadow-md"
                  }`}
                >
                  {isSubmitting ? "Submitting..." : isRejected ? "Submit New Claim" : "Submit Claim"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 rounded-2xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Matches */}
        <div className="bg-white rounded-[28px] shadow-sm border border-slate-200 p-6">
          <h3 className="text-2xl font-bold text-slate-800 mb-5">🔍 Possible Matches</h3>

          {loadingMatches ? (
            <p className="text-slate-500">Loading matches...</p>
          ) : matches.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center text-slate-500">
              No possible matches found for this item.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {matches.map((match) => (
                <Link
                  key={match._id}
                  to={`/item/${match._id}`}
                  className="block bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition duration-200 cursor-pointer"
                >
                  <div className="flex flex-wrap gap-4 mb-3">
                    {match.images && match.images.length > 0 ? (
                      <img
                        src={match.images[0]}
                        alt={match.title}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPreviewImage(match.images[0]);
                        }}
                        className="w-28 h-28 object-cover rounded-xl border border-slate-200 cursor-pointer hover:scale-105 transition"
                      />
                    ) : (
                      <div className="w-28 h-28 bg-gray-200 rounded-xl flex items-center justify-center text-sm text-gray-500">
                        No Image
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-lg font-bold text-slate-800 break-words">
                          {match.title}
                        </h4>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getMatchBadgeStyle(
                            match.matchLabel
                          )}`}
                        >
                          {match.matchLabel}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-slate-600">
                        <p className="break-words">📍 {match.location || "N/A"}</p>
                        <p className="break-words">📂 {match.category}</p>
                        <p>
                          📅{" "}
                          {match.dateOfIncident
                            ? new Date(match.dateOfIncident).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>

                      <p className="text-sm font-semibold text-blue-700 mt-2">
                        Match Score: {match.matchScore}%
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 mb-3 break-words break-all">
                    {match.description}
                  </p>

                  {match.matchReasons?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {match.matchReasons.map((reason, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded-full text-xs"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="mt-4 text-sm font-medium text-blue-600">
                    Click to view details →
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-w-4xl w-full px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-2 right-6 bg-white text-black rounded-full w-10 h-10 text-lg font-bold shadow hover:bg-gray-100"
              >
                ✕
              </button>

              <div className="bg-white rounded-2xl p-4 shadow-2xl">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full max-h-[80vh] object-contain rounded-xl"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ItemDetails;