import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    itemType: "lost",
    location: "",
    dateOfIncident: "",
    contactEmail: "",
    contactPhone: "",
  });

  const [image, setImage] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchItem();
  }, []);

  const fetchItem = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/lost-items/${id}`
      );

      const item = res.data;

      setForm({
        title: item.title || "",
        description: item.description || "",
        category: item.category || "",
        itemType: item.itemType || "lost",
        location: item.location || "",
        dateOfIncident: item.dateOfIncident
          ? item.dateOfIncident.split("T")[0]
          : "",
        contactEmail: item.contactInfo?.email || "",
        contactPhone: item.contactInfo?.phone || "",
      });

      setExistingImages(item.images || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ HANDLE CHANGE WITH VALIDATION
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newErrors = { ...errors };

    // 📞 PHONE VALIDATION
    if (name === "contactPhone") {
      if (!/^\d*$/.test(value)) return;

      if (value.length !== 10) {
        newErrors.contactPhone = "Phone number must be 10 digits";
      } else {
        delete newErrors.contactPhone;
      }
    }

    // 📅 DATE VALIDATION
    if (name === "dateOfIncident") {
      const today = new Date().toISOString().split("T")[0];

      if (value > today) {
        newErrors.dateOfIncident = "Future dates are not allowed";
      } else {
        delete newErrors.dateOfIncident;
      }
    }

    // 🖼 IMAGE REQUIRED IF FOUND
    if (name === "itemType") {
      if (value === "found" && !image && existingImages.length === 0) {
        newErrors.images = "Image is required for found items";
      } else {
        delete newErrors.images;
      }
    }

    setErrors(newErrors);
    setForm({ ...form, [name]: value });
  };

  // ✅ HANDLE IMAGE CHANGE
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    let newErrors = { ...errors };

    if (form.itemType === "found" && !file && existingImages.length === 0) {
      newErrors.images = "Image is required for found items";
    } else {
      delete newErrors.images;
    }

    setErrors(newErrors);
    setImage(file);
  };

  // ✅ HANDLE SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = { ...errors };

    // 🚫 FINAL IMAGE CHECK
    if (form.itemType === "found" && !image && existingImages.length === 0) {
      newErrors.images = "Image is required for found items";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert("Please fix validation errors");
      return;
    }

    try {
      const formData = new FormData();

      Object.keys(form).forEach((key) => {
        formData.append(key, form[key]);
      });

      if (image) {
        formData.append("images", image);
      }

      await axios.put(
        `http://localhost:5000/api/lost-items/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("Item updated successfully");
      navigate("/my-items");
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Edit Lost/Found Item
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Title"
            className="border p-2 w-full rounded"
            required
          />

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            className="border p-2 w-full rounded"
            required
          />

          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          >
            <option value="">Select Category</option>
            <option value="electronics">Electronics</option>
            <option value="documents">Documents</option>
            <option value="accessories">Accessories</option>
            <option value="books">Books</option>
            <option value="clothing">Clothing</option>
            <option value="other">Other</option>
          </select>

          <select
            name="itemType"
            value={form.itemType}
            onChange={handleChange}
            className="border p-2 w-full rounded"
          >
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>

          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="Location"
            className="border p-2 w-full rounded"
          />

          <input
            type="date"
            name="dateOfIncident"
            value={form.dateOfIncident}
            onChange={handleChange}
            max={new Date().toISOString().split("T")[0]}
            className="border p-2 w-full rounded"
          />
          {errors.dateOfIncident && (
            <p className="text-red-500 text-sm">{errors.dateOfIncident}</p>
          )}

          <input
            name="contactEmail"
            value={form.contactEmail}
            onChange={handleChange}
            placeholder="Contact Email"
            className="border p-2 w-full rounded"
          />

          <input
            name="contactPhone"
            value={form.contactPhone}
            onChange={handleChange}
            maxLength={10}
            placeholder="Contact Phone"
            className="border p-2 w-full rounded"
          />
          {errors.contactPhone && (
            <p className="text-red-500 text-sm">{errors.contactPhone}</p>
          )}

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div>
              <p className="text-sm mb-2">Current Images:</p>
              <div className="flex gap-2 flex-wrap">
                {existingImages.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt="existing"
                    className="w-24 h-24 object-cover rounded border"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upload New Image */}
          <input
            type="file"
            onChange={handleImageChange}
            className="border p-2 w-full rounded"
          />
          {errors.images && (
            <p className="text-red-500 text-sm">{errors.images}</p>
          )}

          <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded w-full">
            Update Item
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditItem;