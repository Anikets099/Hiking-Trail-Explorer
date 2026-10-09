import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function TrailFormModal({ isOpen, onClose, onSave, editingTrail }) {
  const [formData, setFormData] = useState({
    name: "",
    location: "Maharashtra, India",
    latitude: 18.5204,
    longitude: 73.8567,
    distance: "5.0 km",
    difficulty: "Moderate",
    elevation: "1,200 m",
    hikingTime: "2-3 hrs",
    bestTime: "Oct - Mar",
    description: "",
    image: "/images/default-trail.jpg"
  });

  useEffect(() => {
    if (editingTrail) {
      setFormData({
        name: editingTrail.name || "",
        // `location` on a saved trail is a GeoJSON point, so build the text from city & state
        location: [editingTrail.city, editingTrail.state].filter(Boolean).join(", ") || "Maharashtra, India",
        latitude: editingTrail.latitude ?? 18.5204,
        longitude: editingTrail.longitude ?? 73.8567,
        distance: editingTrail.distance || "5.0 km",
        difficulty: editingTrail.difficulty || "Moderate",
        elevation: editingTrail.elevation || "1,200 m",
        hikingTime: editingTrail.hikingTime || "2-3 hrs",
        bestTime: editingTrail.bestTime || "Oct - Mar",
        description: editingTrail.description || "",
        image: editingTrail.imageUrl || editingTrail.image || "/images/default-trail.jpg"
      });
    } else {
      setFormData({
        name: "",
        location: "Maharashtra, India",
        latitude: 18.5204,
        longitude: 73.8567,
        distance: "5.0 km",
        difficulty: "Moderate",
        elevation: "1,200 m",
        hikingTime: "2-3 hrs",
        bestTime: "Oct - Mar",
        description: "",
        image: "/images/default-trail.jpg"
      });
    }
  }, [editingTrail, isOpen]);


  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (!Number.isFinite(formData.latitude) || !Number.isFinite(formData.longitude)) return;

    // The API stores city / state / imageUrl rather than the form's combined fields
    const { location, image, ...rest } = formData;
    const [city, ...stateParts] = location.split(",").map((part) => part.trim()).filter(Boolean);
    onSave({
      ...rest,
      name: formData.name.trim(),
      city: city || "Maharashtra",
      state: stateParts.join(", "),
      imageUrl: image.trim()
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editingTrail ? "Edit Trail" : "Add New Trail"}
          </h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Trail Name</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. Rajgad Fort"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. Pune, Maharashtra"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="modal-grid-2">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input
                type="number"
                step="any"
                required
                className="form-control"
                placeholder="18.2562"
                min="-90"
                max="90"
                value={Number.isFinite(formData.latitude) ? formData.latitude : ""}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input
                type="number"
                step="any"
                required
                className="form-control"
                placeholder="73.6826"
                min="-180"
                max="180"
                value={Number.isFinite(formData.longitude) ? formData.longitude : ""}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
              />
            </div>
          </div>

          <div className="modal-grid-2">
            <div className="form-group">
              <label className="form-label">Distance</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="5.2 km"
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Difficulty</label>
              <select
                className="form-control"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              >
                <option value="Easy">Easy</option>
                <option value="Moderate">Moderate</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="modal-grid-2">
            <div className="form-group">
              <label className="form-label">Elevation</label>
              <input
                type="text"
                className="form-control"
                placeholder="1,374 m"
                value={formData.elevation}
                onChange={(e) => setFormData({ ...formData, elevation: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Hiking Time</label>
              <input
                type="text"
                className="form-control"
                placeholder="2-3 hrs"
                value={formData.hikingTime}
                onChange={(e) => setFormData({ ...formData, hikingTime: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Best Time to Visit</label>
            <input
              type="text"
              className="form-control"
              placeholder="Oct - Mar"
              value={formData.bestTime}
              onChange={(e) => setFormData({ ...formData, bestTime: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Image URL / Path</label>
            <input
              type="text"
              className="form-control"
              placeholder="/images/rajgad.png"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              rows="3"
              required
              className="form-control"
              placeholder="Trail overview and highlights..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingTrail ? "Update Trail" : "Add Trail"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
