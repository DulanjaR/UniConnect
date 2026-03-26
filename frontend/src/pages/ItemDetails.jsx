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

  if (!item) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">{item.title}</h2>

      <p className="mb-2">{item.description}</p>

      <p>📍 Location: {item.location}</p>
      <p>📅 Date: {new Date(item.dateOfIncident).toLocaleDateString()}</p>
      <p>📂 Category: {item.category}</p>
      <p>
        Status:{" "}
        {item.itemType === "lost" ? "🔴 Lost" : "🟢 Found"}
      </p>

      <hr className="my-4" />

      <h3 className="font-semibold">Contact Info</h3>
      <p>Email: {item.contactInfo?.email || "N/A"}</p>
      <p>Phone: {item.contactInfo?.phone || "N/A"}</p>
    </div>
  );
}

export default ItemDetails;