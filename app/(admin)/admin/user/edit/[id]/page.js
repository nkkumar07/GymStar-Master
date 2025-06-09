"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { API_URL } from "@/utils/api";
import { AiOutlineArrowLeft } from "react-icons/ai";

export default function EditUser() {
  const [formData, setFormData] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id: userId } = useParams();

  useEffect(() => {
    if (!userId) return;

    fetch(`${API_URL}/users/get/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      })
      .then((user) => {
        const u = Array.isArray(user) ? user[0] : user;
        setFormData({
          first_name: u.first_name || "",
          last_name: u.last_name || "",
          email: u.email || "",
          mobile: u.mobile || "",
          age: u.age?.toString() || "",
          gender: u.gender || "",
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
        toast.error("❌ Failed to load user data.");
        setLoading(false);
      });
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "mobile") {
      if (!/^\d*$/.test(value)) return;
      if (value.length > 10) return;
    }

    if (name === "age") {
      if (!/^\d*$/.test(value)) return;
      if (parseInt(value) > 150) return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) newErrors.first_name = "First name is required";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required";

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Mobile number must be 10 digits";
    }

    if (!formData.age.trim()) {
      newErrors.age = "Age is required";
    } else if (parseInt(formData.age) <= 0) {
      newErrors.age = "Age must be a positive number";
    }

    if (!formData.gender.trim()) newErrors.gender = "Gender is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("❗ Please correct all required fields.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/update/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age),
        }),
      });

      if (res.ok) {
        toast.success("✅ User updated successfully!");
        router.push("/admin/user");
      } else {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          const detail = json.detail || "Unknown error";

          if (detail.includes("email")) {
            setErrors((prev) => ({ ...prev, email: "Email already exists" }));
          }
          if (detail.includes("mobile")) {
            setErrors((prev) => ({ ...prev, mobile: "Mobile number already exists" }));
          }

          toast.error(`❌ Update failed: ${detail}`);
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
      <div className="user-page-loader">
        <p className="user-page-loader-text">🔄 Loading user...</p>
      </div>
    );
  }

  if (!formData) return <p className="text-red-500">❌ Failed to load user data.</p>;

  return (
    <form onSubmit={handleSubmit} className="user-page-form">
      <button
        type="button"
        onClick={() => router.push("/admin/user")}
        className="user-page-back-btn"
      >
        <AiOutlineArrowLeft className="icon" /> Back
      </button>

      <table className="user-page-table">
        <tbody>
          {[{ label: "First Name", name: "first_name" },
          { label: "Last Name", name: "last_name" },
          { label: "Email", name: "email", type: "email" },
          { label: "Mobile", name: "mobile" },
          { label: "Age", name: "age" }
          ].map(({ label, name, type = "text" }) => (
            <tr key={name} className="user-page-row">
              <td className="user-page-label">{label}</td>
              <td className="user-page-input-cell">
                <input
                  type={type}
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  className={`user-page-input ${errors[name] ? "user-page-input-error" : ""}`}
                  required
                />
                {errors[name] && (
                  <small className="user-page-error-text">{errors[name]}</small>
                )}
              </td>
            </tr>
          ))}

          <tr className="user-page-row">
            <td className="user-page-label">Gender</td>
            <td className="user-page-input-cell">
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`user-page-input ${errors.gender ? "user-page-input-error" : ""}`}
                required
              >
                <option value="">-- Select Gender --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && (
                <small className="user-page-error-text">{errors.gender}</small>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="user-page-submit-container">
        <button type="submit" className="user-page-submit-btn">
          Update User
        </button>
      </div>
    </form>
  );
}
