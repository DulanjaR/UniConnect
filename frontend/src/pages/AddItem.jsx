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
    contactPhone: ""
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    try {
      await createItem(form, token);
      alert("Item added successfully");

      // redirect back to lost & found page
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
          className="border p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          required
        />

        <textarea
          name="description"
          placeholder="Description"
          onChange={handleChange}
          className="border p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
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

        <input
          name="contactPhone"
          placeholder="Contact Phone"
          onChange={handleChange}
          className="border p-3 w-full rounded-lg"
        />

        <input
          type="date"
          name="dateOfIncident"
          onChange={handleChange}
          className="border p-3 w-full rounded-lg"
          required
        />

        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition">
          Submit
        </button>

      </form>
    </div>
  </div>
);
}

export default AddItem;