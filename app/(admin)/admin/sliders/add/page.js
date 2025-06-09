"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { API_URL } from "@/utils/api";

const defaultSlider = {
    title: "",
    subtitle: "",
    status: "active",
    image: null,
};

export default function AddSlider() {
    const [sliders, setSliders] = useState([{ ...defaultSlider }]);
    const [errors, setErrors] = useState([{}]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (index, field, value) => {
        const updated = [...sliders];
        updated[index][field] = value;
        setSliders(updated);

        const updatedErrors = [...errors];
        if (updatedErrors[index]) updatedErrors[index][field] = "";
        setErrors(updatedErrors);
    };

    const handleImageChange = (index, file) => {
        const updated = [...sliders];
        updated[index].image = file;
        setSliders(updated);

        const updatedErrors = [...errors];
        if (updatedErrors[index]) updatedErrors[index].image = "";
        setErrors(updatedErrors);
    };

    const addRow = () => {
        setSliders([{ ...defaultSlider }, ...sliders]);
        setErrors([{}, ...errors]);
    };

    const removeRow = (index) => {
        if (sliders.length === 1) {
            toast.warning("⚠️ You cannot remove the last remaining slider row.");
            return;
        }
        setSliders(sliders.filter((_, i) => i !== index));
        setErrors(errors.filter((_, i) => i !== index));
    };

    const validate = () => {
        let hasError = false;
        const newErrors = sliders.map((s) => {
            const fieldErrors = {};
            if (!s.title.trim()) fieldErrors.title = "Title is required";
            if (!s.subtitle.trim()) fieldErrors.subtitle = "Subtitle is required";
            if (!s.status.trim()) fieldErrors.status = "Status is required";
            if (!s.image) fieldErrors.image = "Image is required";
            if (Object.keys(fieldErrors).length > 0) hasError = true;
            return fieldErrors;
        });
        setErrors(newErrors);
        return !hasError;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("❗ Please correct errors before submitting.");
            return;
        }

        setLoading(true);
        try {
            for (const slider of sliders) {
                const formData = new FormData();
                formData.append("title", slider.title);
                formData.append("subtitle", slider.subtitle);
                formData.append("status", slider.status);
                formData.append("image", slider.image);

                const res = await fetch(`${API_URL}/slider/post`, {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) {
                    const err = await res.text();
                    toast.error(`❌ Failed to submit: ${slider.title}`);
                    console.error("Upload error:", err);
                    setLoading(false);
                    return;
                }
            }

            toast.success("✅ Sliders added successfully!");
            router.push("/admin/sliders");
        } catch (error) {
            console.error("Submission error:", error);
            toast.error("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="slider-add-container">
            {loading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <p className="loading-text">Submitting sliders...</p>
                </div>
            )}

            <h1 className="slider-add-heading">Add Sliders</h1>
            <button type="button" onClick={() => router.push("/admin/sliders")} className="slider-back-btn">
                ◀ Back
            </button>

            <form onSubmit={handleSubmit}>
                <div className="slider-table-wrapper">
                    <table className="slider-table">
                        <thead className="slider-table-header">
                            <tr>
                                <th>Title</th>
                                <th>Subtitle</th>
                                <th>Status</th>
                                <th>Image</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sliders.map((slider, index) => (
                                <tr key={index} className="slider-table-row">
                                    <td>
                                        <input
                                            type="text"
                                            value={slider.title}
                                            onChange={(e) => handleChange(index, "title", e.target.value)}
                                            className={`slider-input ${errors[index]?.title ? "slider-input-error" : ""}`}
                                            placeholder="Slider Title"
                                        />
                                        {errors[index]?.title && <small className="slider-error-text">{errors[index].title}</small>}
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            value={slider.subtitle}
                                            onChange={(e) => handleChange(index, "subtitle", e.target.value)}
                                            className={`slider-input ${errors[index]?.subtitle ? "slider-input-error" : ""}`}
                                            placeholder="Slider Subtitle"
                                        />
                                        {errors[index]?.subtitle && <small className="slider-error-text">{errors[index].subtitle}</small>}
                                    </td>
                                    <td>
                                        <select
                                            value={slider.status}
                                            onChange={(e) => handleChange(index, "status", e.target.value)}
                                            className={`slider-input ${errors[index]?.status ? "slider-input-error" : ""}`}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                        {errors[index]?.status && <small className="slider-error-text">{errors[index].status}</small>}
                                    </td>
                                    <td>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageChange(index, e.target.files[0])}
                                            className={`slider-input ${errors[index]?.image ? "slider-input-error" : ""}`}
                                        />
                                        {slider.image && (
                                            <img
                                                src={URL.createObjectURL(slider.image)}
                                                alt="Preview"
                                                className="slider-preview-img"
                                            />
                                        )}
                                        {errors[index]?.image && <small className="slider-error-text">{errors[index].image}</small>}
                                    </td>
                                    <td className="slider-action-cell">
                                        <button type="button" onClick={() => removeRow(index)} className="slider-remove-btn">
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="slider-actions">
                    <button type="button" onClick={addRow} className="slider-btn slider-add-btn">
                        + Add Slider
                    </button>
                    <button type="submit" className="slider-btn slider-submit-btn" disabled={loading}>
                        {loading ? "Submitting..." : "Submit All"}
                    </button>
                </div>
            </form>
        </div>
    );

}
