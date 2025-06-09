"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { API_URL } from "@/utils/api";
import { FaArrowLeft } from "react-icons/fa";

export default function EditMembershipPlan() {
  const [formData, setFormData] = useState(null);
  const [planInfo, setPlanInfo] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id: planId } = useParams();

  useEffect(() => {
    if (!planId) return;

    const fetchData = async () => {
      try {
        const [planRes, infoRes] = await Promise.all([
          fetch(`${API_URL}/membership/get/${planId}`),
          fetch(`${API_URL}/planInfo/get_by_membership_id/${planId}`),
        ]);

        if (!planRes.ok || !infoRes.ok) throw new Error("Fetch failed");

        const plan = await planRes.json();
        const planInfoData = await infoRes.json();

        setFormData({
          name: plan.name || "",
          price: plan.price?.toString() || "",
          discount: plan.discount?.toString() || "",
          final_price: plan.final_price?.toString() || "",
          duration: plan.duration || "",
          plan_info: plan.plan_info || "",
          status: plan.status || "",
        });

        setPlanInfo({
          membership_id: planId,
          line_1: planInfoData[0]?.line_1 || "",
          line_2: planInfoData[0]?.line_2 || "",
          line_3: planInfoData[0]?.line_3 || "",
          line_4: planInfoData[0]?.line_4 || "",
          line_5: planInfoData[0]?.line_5 || "",
          line_6: planInfoData[0]?.line_6 || "",
          line_7: planInfoData[0]?.line_7 || "",
        });

        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error("❌ Failed to load plan or plan info.");
        setLoading(false);
      }
    };

    fetchData();
  }, [planId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const isNumeric = ["price", "discount", "final_price"].includes(name);
    const limits = {
      line_1: 30, line_2: 30, line_3: 30,
      line_4: 30, line_5: 30, line_6: 60, line_7: 30,
    };

    if (isNumeric && !/^\d*$/.test(value)) return;
    if (name in limits && value.length > limits[name]) return;

    if (formData?.hasOwnProperty(name)) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else if (planInfo?.hasOwnProperty(name)) {
      setPlanInfo((prev) => ({ ...prev, [name]: value }));
    }

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const required = [
      "name", "price", "discount", "final_price", "duration",
      "plan_info", "status", "line_1", "line_2", "line_3", "line_4", "line_5", "line_6", "line_7"
    ];
    const newErrors = {};
    required.forEach((field) => {
      const val = formData?.[field] ?? planInfo?.[field];
      if (!val?.trim()) newErrors[field] = `${field.replace("_", " ")} is required`;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return toast.error("❗ Please correct all fields.");

    try {
      const [res1, res2] = await Promise.all([
        fetch(`${API_URL}/membership/update/${planId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            price: +formData.price,
            discount: +formData.discount,
            final_price: +formData.final_price,
          }),
        }),
        fetch(`${API_URL}/planInfo/update_by_membership_id/${planId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(planInfo),
        }),
      ]);

      if (res1.ok && res2.ok) {
        toast.success("✅ Membership plan updated successfully!");
        router.push("/admin/membership");
      } else {
        toast.error("❌ Failed to update plan.");
      }
    } catch (err) {
      console.error(err);
      toast.error("❌ Update failed.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!formData || !planInfo) return <p className="text-red-500">❌ Failed to load data.</p>;

  return (
    <form onSubmit={handleSubmit} className="membership-edit-form">
      <button type="button" onClick={() => router.push("/admin/membership")} className="btn-back">
        <FaArrowLeft className="icon-left" /> Back
      </button>

      <table className="form-table">
        <tbody>
          {[
            { label: "Plan Name", name: "name" },
            { label: "Price", name: "price" },
            { label: "Discount %", name: "discount" },
            { label: "Final Price", name: "final_price" },
            { label: "Duration", name: "duration" },
          ].map(({ label, name }) => (
            <tr key={name}>
              <td>{label}</td>
              <td>
                <input
                  type="text"
                  name={name}
                  value={formData[name]}
                  onChange={handleChange}
                  className={`input ${errors[name] ? "input-error" : ""}`}
                  required
                />
                {errors[name] && <small className="error-text">{errors[name]}</small>}
              </td>
            </tr>
          ))}

          {["line_1", "line_2", "line_3", "line_4", "line_5", "line_6", "line_7"].map((name) => (
            <tr key={name}>
              <td>{name.replace("_", " ").toUpperCase()}</td>
              <td>
                <input
                  type="text"
                  name={name}
                  value={planInfo[name]}
                  onChange={handleChange}
                  className={`input ${errors[name] ? "input-error" : ""}`}
                  required
                />
                {errors[name] && <small className="error-text">{errors[name]}</small>}
              </td>
            </tr>
          ))}

          <tr>
            <td>Status</td>
            <td>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`input ${errors.status ? "input-error" : ""}`}
                required
              >
                <option value="">-- Select Status --</option>
                <option value="active">Active</option>
                <option value="non-active">Inactive</option>
              </select>
              {errors.status && <small className="error-text">{errors.status}</small>}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="form-submit-container">
        <button type="submit" className="btn-submit">
          Update Plan
        </button>
      </div>
    </form>
  );
}
