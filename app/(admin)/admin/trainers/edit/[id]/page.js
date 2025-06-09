"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { API_URL } from "@/utils/api";
import { FaArrowLeft } from "react-icons/fa";

export default function EditTrainer() {
    const [formData, setFormData] = useState({
        name: "",
        designation: "",
        mobile_number: "",
        twitter_link: "",
        fb_link: "",
        linkedin_link: "",
        image: null,
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [existingImage, setExistingImage] = useState(null);
    const router = useRouter();
    const { id: trainerId } = useParams();

    useEffect(() => {
        if (!trainerId) return;

        fetch(`${API_URL}/trainer/get_by_id/${trainerId}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch trainer");
                return res.json();
            })
            .then((trainer) => {
                setFormData({
                    name: trainer.name || "",
                    designation: trainer.designation || "",
                    mobile_number: trainer.mobile_number || "",
                    twitter_link: trainer.twitter_link || "",
                    fb_link: trainer.fb_link || "",
                    linkedin_link: trainer.linkedin_link || "",
                    image: null,
                });

                setExistingImage(`${API_URL}${trainer.image}`);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching trainer:", err);
                toast.error("❌ Failed to load trainer data.");
                setLoading(false);
            });
    }, [trainerId]);

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
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.designation.trim()) newErrors.designation = "Designation is required";
        if (!formData.mobile_number.trim()) newErrors.mobile_number = "Mobile number is required";
        if (!/^\d{10}$/.test(formData.mobile_number)) {
            toast.warning("⚠️ Please enter a valid 10-digit mobile number.");
            return;
        }

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
        data.append("name", formData.name);
        data.append("designation", formData.designation);
        data.append("mobile_number", formData.mobile_number);
        data.append("twitter_link", formData.twitter_link);
        data.append("fb_link", formData.fb_link);
        data.append("linkedin_link", formData.linkedin_link);
        if (formData.image) {
            data.append("image", formData.image);
        }

        try {
            const res = await fetch(`${API_URL}/trainer/update/${trainerId}`, {
                method: "PUT",
                body: data,
            });

            if (res.ok) {
                toast.success("✅ Trainer updated successfully!");
                router.push("/admin/trainers");
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
            <div className="trainer-edit-loader-container">
                <p className="trainer-edit-loader-text">Loading trainer...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="trainer-edit-form">
            <button
                type="button"
                onClick={() => router.push("/admin/trainers")}
                className="trainer-edit-back-btn"
            >
                <FaArrowLeft className="trainer-edit-icon" /> Back
            </button>

            <table className="trainer-edit-table">
                <tbody>
                    <tr className="trainer-edit-row">
                        <td className="trainer-edit-label">Name</td>
                        <td className="trainer-edit-input-cell">
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`trainer-edit-input ${errors.name ? "trainer-edit-error-input" : ""}`}
                                required
                            />
                            {errors.name && <small className="trainer-edit-error-text">{errors.name}</small>}
                        </td>
                    </tr>

                    <tr className="trainer-edit-row">
                        <td className="trainer-edit-label">Designation</td>
                        <td className="trainer-edit-input-cell">
                            <input
                                type="text"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                className={`trainer-edit-input ${errors.designation ? "trainer-edit-error-input" : ""}`}
                                required
                            />
                            {errors.designation && (
                                <small className="trainer-edit-error-text">{errors.designation}</small>
                            )}
                        </td>
                    </tr>

                    <tr className="trainer-edit-row">
                        <td className="trainer-edit-label">Mobile Number</td>
                        <td className="trainer-edit-input-cell">
                            <input
                                type="text"
                                name="mobile_number"
                                value={formData.mobile_number}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^\d*$/.test(value)) {
                                        setFormData({ ...formData, mobile_number: value });
                                    }
                                }}
                                onPaste={(e) => {
                                    const paste = e.clipboardData.getData("text");
                                    if (!/^\d+$/.test(paste)) {
                                        e.preventDefault();
                                        toast.error("❌ Only numeric values allowed.");
                                    }
                                }}
                                maxLength={10}
                                placeholder="Enter 10-digit mobile number"
                                className="trainer-edit-input"
                            />
                            {errors.mobile_number && (
                                <small className="trainer-edit-error-text">{errors.mobile_number}</small>
                            )}
                        </td>
                    </tr>

                    {["twitter_link", "fb_link", "linkedin_link"].map((field) => (
                        <tr className="trainer-edit-row" key={field}>
                            <td className="trainer-edit-label">
                                {field.replace("_link", "").replace(/^\w/, (c) => c.toUpperCase())} Link
                            </td>
                            <td className="trainer-edit-input-cell">
                                <input
                                    type="url"
                                    name={field}
                                    value={formData[field]}
                                    onChange={handleChange}
                                    className="trainer-edit-input"
                                />
                            </td>
                        </tr>
                    ))}

                    <tr className="trainer-edit-row">
                        <td className="trainer-edit-label">Upload Image</td>
                        <td className="trainer-edit-input-cell">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="trainer-edit-input-file"
                            />
                            {(formData.image || existingImage) && (
                                <div style={{ marginTop: "10px" }}>
                                    <strong>Preview:</strong>
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

            <div className="trainer-edit-submit-container">
                <button type="submit" className="trainer-edit-submit-btn">
                    Update Trainer
                </button>
            </div>
        </form>
    );
}
