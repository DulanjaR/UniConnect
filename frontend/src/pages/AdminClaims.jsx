import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminClaims() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to admin dashboard claims tab
    if (user?.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to Admin Dashboard...</p>
    </div>
  );
}

export default AdminClaims;
              All submitted claims have been reviewed.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {claims.map((claim) => (
              <div
                key={claim._id}
                className="bg-white rounded-[28px] shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                <div className="border-b border-slate-100 px-6 py-4 bg-slate-50/70">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">
                        Claim Review
                      </h3>
                      <p className="text-sm text-slate-500">
                        Submitted by {claim.name}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit px-3 py-1 rounded-full text-sm font-semibold ${getStatusStyle(
                        claim.status
                      )}`}
                    >
                      {claim.status}
                    </span>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
                  {/* Claimant Details */}
                  <div className="xl:col-span-4 bg-slate-50 rounded-2xl border border-slate-200 p-5">
                    <h4 className="text-lg font-bold text-slate-800 mb-4">
                      Claimant Details
                    </h4>

                    <div className="space-y-3 text-slate-700">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Name
                        </span>
                        <span className="text-base font-medium">{claim.name}</span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Student ID
                        </span>
                        <span className="text-base font-medium">{claim.studentId}</span>
                      </div>

                      <div className="flex flex-col break-all">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Claim Email
                        </span>
                        <span className="text-base font-medium">{claim.email}</span>
                      </div>

                      {claim.userId?.name && (
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            User Account
                          </span>
                          <span className="text-base font-medium">{claim.userId.name}</span>
                        </div>
                      )}

                      {claim.userId?.email && (
                        <div className="flex flex-col break-all">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Account Email
                          </span>
                          <span className="text-base font-medium">{claim.userId.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      <p className="text-sm font-semibold text-slate-700 mb-3">
                        Student ID Card
                      </p>

                      {claim.idCardImage ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-3 w-fit shadow-sm">
                          <img
                            src={claim.idCardImage}
                            alt="ID Card"
                            onClick={() => setPreviewImage(claim.idCardImage)}
                            className="w-56 h-36 object-contain rounded-xl bg-slate-50 cursor-pointer hover:scale-105 transition"
                          />
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-400 text-sm text-center">
                          No ID card uploaded
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Claimed Item */}
                  <div className="xl:col-span-4 bg-slate-50 rounded-2xl border border-slate-200 p-5">
                    <h4 className="text-lg font-bold text-slate-800 mb-4">
                      Claimed Item
                    </h4>

                    {claim.itemId ? (
                      <div className="space-y-4">
                        <div className="space-y-3 text-slate-700">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Title
                            </span>
                            <span className="text-base font-medium">
                              {claim.itemId.title}
                            </span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Location
                            </span>
                            <span className="text-base font-medium">
                              {claim.itemId.location || "N/A"}
                            </span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Category
                            </span>
                            <span className="text-base font-medium capitalize">
                              {claim.itemId.category || "N/A"}
                            </span>
                          </div>

                          <div className="flex flex-col">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Type
                            </span>
                            <span
                              className={`inline-flex w-fit px-3 py-1 rounded-full text-sm font-semibold ${getItemTypeStyle(
                                claim.itemId.itemType
                              )}`}
                            >
                              {claim.itemId.itemType}
                            </span>
                          </div>
                        </div>

                        {claim.itemId.images && claim.itemId.images.length > 0 ? (
                          <div className="rounded-2xl border border-slate-200 bg-white p-3 w-fit shadow-sm">
                            <img
                              src={claim.itemId.images[0]}
                              alt="Claimed item"
                              onClick={() => setPreviewImage(claim.itemId.images[0])}
                              className="w-56 h-40 object-contain rounded-xl bg-slate-50 cursor-pointer hover:scale-105 transition"
                            />
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-400 text-sm text-center">
                            No item image
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-slate-400 text-sm text-center">
                        Item details not available
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="xl:col-span-4 flex flex-col">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-5 text-white h-full flex flex-col justify-between">
                      <div>
                        <h4 className="text-lg font-bold mb-3">Actions</h4>
                        <p className="text-sm text-slate-200 leading-6">
                          Review the claimant information, compare the uploaded ID card
                          with the claimed item details, and then decide whether to
                          approve or reject the request.
                        </p>
                      </div>

                      <div className="mt-8">
                        {updatingId === claim._id ? (
                          <div
                            className={`px-4 py-4 rounded-2xl text-center font-bold text-base shadow-sm ${
                              claim.status === "approved"
                                ? "bg-green-100 text-green-700 border border-green-300"
                                : "bg-red-100 text-red-700 border border-red-300"
                            }`}
                          >
                            {claim.status === "approved"
                              ? "✅ Claim Approved"
                              : "❌ Claim Rejected"}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                            <button
                              onClick={() => handleApprove(claim._id)}
                              className="w-full px-5 py-3 rounded-2xl text-white font-semibold bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition"
                            >
                              Approve Claim
                            </button>

                            <button
                              onClick={() => handleReject(claim._id)}
                              className="w-full px-5 py-3 rounded-2xl text-white font-semibold bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg transition"
                            >
                              Reject Claim
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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
>>>>>>> dev
    </div>
  );
}

export default AdminClaims;
