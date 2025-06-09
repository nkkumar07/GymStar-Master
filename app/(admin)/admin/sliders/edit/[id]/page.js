"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { API_URL } from "@/utils/api";
import { FaArrowLeft, FaImage } from "react-icons/fa";

export default function EditSlider() {
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    status: "",
    image: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [existingImage, setExistingImage] = useState(null);
  const router = useRouter();
  const { id: sliderId } = useParams();

  useEffect(() => {
    if (!sliderId) return;

    fetch(`${API_URL}/slider/get/${sliderId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch slider");
        return res.json();
      })
      .then((slider) => {
        setFormData({
          title: slider.title || "",
          subtitle: slider.subtitle || "",
          status: slider.status || "active",
          image: null,
        });
        setExistingImage(`${API_URL}/${slider.image}`);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching slider:", err);
        toast.error("❌ Failed to load slider data.");
        setLoading(false);
      });
  }, [sliderId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, image: file }));
    setExistingImage(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.subtitle.trim()) newErrors.subtitle = "Subtitle is required";
    if (!formData.status.trim()) newErrors.status = "Status is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("❗ Please correct all required fields.");
      return;
    }

    const data = new FormData();
    data.append("title", formData.title);
    data.append("subtitle", formData.subtitle);
    data.append("status", formData.status);
    if (formData.image) data.append("image", formData.image);

    try {
      const res = await fetch(`${API_URL}/slider/update/${sliderId}`, {
        method: "PUT",
        body: data,
      });

      if (res.ok) {
        toast.success("✅ Slider updated successfully!");
        router.push("/admin/sliders");
      } else {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          toast.error(`❌ Update failed: ${json.detail || "Unknown error"}`);
        } catch {
          toast.error(`❌ Update failed: ${text || res.statusText}`);
        }
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("❌ Something went wrong during update.");
    }
  };

  if (loading) {
    return (
      <div className="slider-loader-container">
        <p className="slider-loader-text">🔄 Loading slider...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="slider-edit-form">
      <button
        type="button"
        onClick={() => router.push("/admin/sliders")}
        className="slider-back-btn"
      >
        <FaArrowLeft className="icon" /> Back
      </button>

      <table className="slider-edit-table">
        <tbody>
          <tr className="slider-edit-row">
            <td className="slider-edit-label">Title</td>
            <td className="slider-edit-input-cell">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`slider-input ${errors.title ? "slider-input-error" : ""}`}
                required
              />
              {errors.title && (
                <small className="slider-error-text">{errors.title}</small>
              )}
            </td>
          </tr>

          <tr className="slider-edit-row">
            <td className="slider-edit-label">Subtitle</td>
            <td className="slider-edit-input-cell">
              <input
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                className={`slider-input ${errors.subtitle ? "slider-input-error" : ""}`}
                required
              />
              {errors.subtitle && (
                <small className="slider-error-text">{errors.subtitle}</small>
              )}
            </td>
          </tr>

          <tr className="slider-edit-row">
            <td className="slider-edit-label">Status</td>
            <td className="slider-edit-input-cell">
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`slider-input ${errors.status ? "slider-input-error" : ""}`}
                required
              >
                <option value="">-- Select Status --</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {errors.status && (
                <small className="slider-error-text">{errors.status}</small>
              )}
            </td>
          </tr>

          <tr className="slider-edit-row">
            <td className="slider-edit-label">Upload Image</td>
            <td className="slider-edit-input-cell">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="slider-input"
              />
              {(formData.image || existingImage) && (
                <div style={{ marginTop: "10px" }}>
                  <strong>
                    <FaImage style={{ marginRight: "6px" }} />
                    Preview:
                  </strong>
                  <br />
                  <img
                    src={
                      formData.image
                        ? URL.createObjectURL(formData.image)
                        : existingImage
                    }
                    alt="Preview"
                    style={{
                      maxWidth: "200px",
                      marginTop: "8px",
                      borderRadius: "6px",
                    }}
                  />
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="slider-submit-container">
        <button type="submit" className="slider-submit-btn">
          Update Slider
        </button>
      </div>
    </form>
  );
}
