"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { API_URL } from "@/utils/api";
import { FiArrowLeft, FiPlus, FiTrash2 } from "react-icons/fi";

const defaultTrainer = {
  name: "",
  designation: "",
  mobile_number: "",
  twitter_link: "",
  fb_link: "",
  linkedin_link: "",
  image: null,
};

export default function AddTrainer() {
  const [trainers, setTrainers] = useState([{ ...defaultTrainer }]);
  const [errors, setErrors] = useState([{}]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (index, field, value) => {
    const updated = [...trainers];

    if (field === "mobile_number") {
      // Remove non-digit characters and limit to 10 digits
      value = value.replace(/\D/g, "").slice(0, 10);
    }

    updated[index][field] = value;
    setTrainers(updated);

    const updatedErrors = [...errors];
    if (updatedErrors[index]) updatedErrors[index][field] = "";
    setErrors(updatedErrors);
  };

  const handleImageChange = (index, file) => {
    const updated = [...trainers];
    updated[index].image = file;
    setTrainers(updated);

    const updatedErrors = [...errors];
    if (updatedErrors[index]) updatedErrors[index].image = "";
    setErrors(updatedErrors);
  };

  const addRow = () => {
    setTrainers([{ ...defaultTrainer }, ...trainers]);
    setErrors([{}, ...errors]);
  };

  const removeRow = (index) => {
    if (trainers.length === 1) {
      toast.warning("⚠️ You cannot remove the last remaining trainer row.");
      return;
    }
    setTrainers(trainers.filter((_, i) => i !== index));
    setErrors(errors.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors = trainers.map((t) => {
      const fieldErrors = {};
      if (!t.name.trim()) fieldErrors.name = "Name is required";
      if (!t.designation.trim()) fieldErrors.designation = "Designation is required";
      if (!t.mobile_number.trim()) {
        fieldErrors.mobile_number = "Mobile number is required";
      } else if (!/^\d{10}$/.test(t.mobile_number)) {
        fieldErrors.mobile_number = "Mobile number must be 10 digits";
      }
      if (!t.image) fieldErrors.image = "Image is required";
      return fieldErrors;
    });
    setErrors(newErrors);
    return !newErrors.some((err) => Object.keys(err).length > 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("❗ Please correct errors before submitting.");
      return;
    }

    setLoading(true);
    try {
      for (const trainer of trainers) {
        const formData = new FormData();
        formData.append("name", trainer.name);
        formData.append("designation", trainer.designation);
        formData.append("mobile_number", trainer.mobile_number);
        formData.append("twitter_link", trainer.twitter_link);
        formData.append("fb_link", trainer.fb_link);
        formData.append("linkedin_link", trainer.linkedin_link);
        formData.append("image", trainer.image);

        const res = await fetch(`${API_URL}/trainer/`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.text();
          toast.error(`❌ Failed to submit: ${trainer.name}`);
          console.error("Upload error:", err);
          setLoading(false);
          return;
        }
      }

      toast.success("✅ Trainers added successfully!");
      router.push("/admin/trainers");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="trainer-add-container">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p className="loading-text">Submitting trainers...</p>
        </div>
      )}

      <h1 className="trainer-add-heading">Add Trainers</h1>
      <button type="button" onClick={() => router.push("/admin/trainers")} className="btn-back">
        <FiArrowLeft size={20} /> Back
      </button>

      <form onSubmit={handleSubmit}>
        <div className="trainer-table-wrapper">
          <table className="trainer-table">
            <thead className="trainer-table-header">
              <tr>
                <th>Name</th>
                <th>Designation</th>
                <th>Mobile</th>
                <th>Twitter</th>
                <th>Facebook</th>
                <th>LinkedIn</th>
                <th>Image</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trainers.map((trainer, index) => (
                <tr key={index} className="trainer-table-row">
                  <td>
                    <input
                      type="text"
                      value={trainer.name}
                      onChange={(e) => handleChange(index, "name", e.target.value)}
                      className={`trainer-input ${errors[index]?.name ? "input-error" : ""}`}
                      placeholder="Name"
                    />
                    {errors[index]?.name && <small className="error-text">{errors[index].name}</small>}
                  </td>
                  <td>
                    <input
                      type="text"
                      value={trainer.designation}
                      onChange={(e) => handleChange(index, "designation", e.target.value)}
                      className={`trainer-input ${errors[index]?.designation ? "input-error" : ""}`}
                      placeholder="Designation"
                    />
                    {errors[index]?.designation && <small className="error-text">{errors[index].designation}</small>}
                  </td>
                  <td>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      value={trainer.mobile_number}
                      onChange={(e) => handleChange(index, "mobile_number", e.target.value)}
                      className={`trainer-input ${errors[index]?.mobile_number ? "input-error" : ""}`}
                      placeholder="Mobile Number"
                    />
                    {errors[index]?.mobile_number && <small className="error-text">{errors[index].mobile_number}</small>}
                  </td>
                  <td>
                    <input
                      type="text"
                      value={trainer.twitter_link}
                      onChange={(e) => handleChange(index, "twitter_link", e.target.value)}
                      className="trainer-input"
                      placeholder="Twitter URL"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={trainer.fb_link}
                      onChange={(e) => handleChange(index, "fb_link", e.target.value)}
                      className="trainer-input"
                      placeholder="Facebook URL"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={trainer.linkedin_link}
                      onChange={(e) => handleChange(index, "linkedin_link", e.target.value)}
                      className="trainer-input"
                      placeholder="LinkedIn URL"
                    />
                  </td>
                  <td>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(index, e.target.files[0])}
                      className={`trainer-input ${errors[index]?.image ? "input-error" : ""}`}
                    />
                    {trainer.image && (
                      <img src={URL.createObjectURL(trainer.image)} alt="Preview" className="small-preview" />
                    )}
                    {errors[index]?.image && <small className="error-text">{errors[index].image}</small>}
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="btn-remove"
                      title="Remove Trainer"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="trainer-actions">
          <button type="button" onClick={addRow} className="btn btn-add">
            <FiPlus size={18} /> Add Trainer
          </button>
          <button type="submit" className="btn btn-submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit All"}
          </button>
        </div>
      </form>
    </div>
  );
}
