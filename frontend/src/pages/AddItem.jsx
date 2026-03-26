import { useState } from "react";
import { createItem } from "../services/lostItemService";
import { useNavigate } from "react-router-dom";

function AddItem() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    itemType: "lost",
    location: "",
    dateOfIncident: "",
    contactEmail: "",
    contactPhone: "",
    images: null
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

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
      if (value === "found" && !form.images) {
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
    const files = e.target.files;
    let newErrors = { ...errors };

    if (form.itemType === "found" && (!files || files.length === 0)) {
      newErrors.images = "Image is required for found items";
    } else {
      delete newErrors.images;
    }

    setErrors(newErrors);
    setForm({ ...form, images: files });
  };

  // ✅ HANDLE SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = { ...errors };

    // 🚫 FINAL CHECK: image required if found
    if (form.itemType === "found" && !form.images) {
      newErrors.images = "Image is required for found items";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert("Please fix validation errors");
      return;
    }

    const token = localStorage.getItem("token");

    const formData = new FormData();

    Object.keys(form).forEach((key) => {
      if (key === "images" && form.images) {
        for (let i = 0; i < form.images.length; i++) {
          formData.append("images", form.images[i]);
        }
      } else {
        formData.append(key, form[key]);
      }
    });

    try {
      await createItem(formData, token);
      alert("Item added successfully");
      navigate("/lost-found");
    } catch (err) {
      console.error(err);
      alert("Error adding item");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-light-beige p-6">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-lg">

        <h2 className="text-2xl font-bold mb-6 text-center">
          Add Lost/Found Item
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            name="title"
            placeholder="Title"
            onChange={handleChange}
            className="border p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-400"
            required
          />

          <textarea
            name="description"
            placeholder="Description"
            onChange={handleChange}
            className="border p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-400"
            required
          />

          <select
            name="category"
            onChange={handleChange}
            className="border p-3 w-full rounded-lg"
            required
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
            onChange={handleChange}
            className="border p-3 w-full rounded-lg"
          >
            <option value="lost">Lost</option>
            <option value="found">Found</option>
          </select>

          <input
            name="location"
            placeholder="Location"
            onChange={handleChange}
            className="border p-3 w-full rounded-lg"
          />

          <input
            name="contactEmail"
            placeholder="Contact Email"
            onChange={handleChange}
            className="border p-3 w-full rounded-lg"
          />

          {/* 📞 PHONE */}
          <input
            name="contactPhone"
            placeholder="Contact Phone"
            value={form.contactPhone}
            onChange={handleChange}
            maxLength={10}
            className="border p-3 w-full rounded-lg"
          />
          {errors.contactPhone && (
            <p className="text-red-500 text-sm">{errors.contactPhone}</p>
          )}

          {/* 📅 DATE */}
          <input
            type="date"
            name="dateOfIncident"
            value={form.dateOfIncident}
            onChange={handleChange}
            max={new Date().toISOString().split("T")[0]}
            className="border p-3 w-full rounded-lg"
            required
          />
          {errors.dateOfIncident && (
            <p className="text-red-500 text-sm">{errors.dateOfIncident}</p>
          )}

          {/* 🖼 IMAGE */}
          <input
            type="file"
            name="images"
            multiple
            onChange={handleImageChange}
            className="border p-2 w-full rounded"
          />
          {errors.images && (
            <p className="text-red-500 text-sm">{errors.images}</p>
          )}

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition">
            Submit
          </button>

        </form>
      </div>
    </div>
  );
}

export default AddItem;