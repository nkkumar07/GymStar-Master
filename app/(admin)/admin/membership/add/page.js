"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { API_URL } from "@/utils/api";
import { AiOutlinePlus, AiOutlineDelete, AiOutlineArrowLeft } from "react-icons/ai";

const defaultPlan = {
  name: "",
  price: "",
  discount: "",
  final_price: "",
  duration: "",
  plan_info: {
    line_1: "", line_2: "", line_3: "", line_4: "", line_5: "", line_6: "", line_7: "",
  },
  status: "active",
};

export default function AddMembershipPlan() {
  const [plans, setPlans] = useState([{ ...defaultPlan }]);
  const [errors, setErrors] = useState([{}]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const calculateFinalPrice = (price, discount) => {
    const priceValue = parseFloat(price) || 0;
    const discountValue = parseFloat(discount) || 0;
    return (priceValue - (priceValue * discountValue / 100)).toFixed(2);
  };

  const handleChange = (index, field, value, lineField = null) => {
    const updated = [...plans];

    if (["price", "discount", "final_price"].includes(field)) {
      if (!/^\d*\.?\d*$/.test(value)) return;
    }

    if (field === "plan_info" && lineField) {
      const maxLengths = {
        line_1: 30, line_2: 30, line_3: 30, line_4: 30, line_5: 30, line_6: 60, line_7: 30,
      };
      if (value.length > maxLengths[lineField]) return;
      updated[index][field][lineField] = value;
    } else {
      updated[index][field] = value;
    }

    if (field === "price" || field === "discount") {
      updated[index].final_price = calculateFinalPrice(
        field === "price" ? value : updated[index].price,
        field === "discount" ? value : updated[index].discount
      );
    }

    setPlans(updated);

    const updatedErrors = [...errors];
    if (updatedErrors[index]) {
      if (lineField) {
        if (!updatedErrors[index][field]) updatedErrors[index][field] = {};
        updatedErrors[index][field][lineField] = "";
      } else {
        updatedErrors[index][field] = "";
      }
    }
    setErrors(updatedErrors);
  };

  const addRow = () => {
    setPlans([{ ...defaultPlan }, ...plans]);
    setErrors([{}, ...errors]);
  };

  const removeRow = (index) => {
    if (plans.length === 1) {
      toast.warning("⚠️ You cannot remove the last remaining plan row.");
      return;
    }
    setPlans(plans.filter((_, i) => i !== index));
    setErrors(errors.filter((_, i) => i !== index));
  };

  const validate = () => {
    let hasError = false;
    const newErrors = plans.map((plan) => {
      const fieldErrors = {};
      if (!plan.name.trim()) fieldErrors.name = "Name is required";
      if (!plan.price.trim()) fieldErrors.price = "Price is required";
      else if (isNaN(parseFloat(plan.price))) fieldErrors.price = "Price must be a number";
      if (!plan.discount.trim()) fieldErrors.discount = "Discount is required";
      else if (isNaN(parseFloat(plan.discount.replace('%', '')))) {
        fieldErrors.discount = "Discount must be a number";
      }
      if (!plan.final_price.trim()) fieldErrors.final_price = "Final price is required";
      if (!plan.duration.trim()) fieldErrors.duration = "Duration is required";

      const infoErrors = {};
      const limits = { line_1: 30, line_2: 30, line_3: 30, line_4: 30, line_5: 30, line_6: 60, line_7: 30 };
      const requiredLines = ['line_1', 'line_2', 'line_3'];
      requiredLines.forEach(line => {
        if (!plan.plan_info[line].trim()) {
          infoErrors[line] = "This field is required";
        }
      });

      Object.entries(plan.plan_info).forEach(([key, val]) => {
        if (val.length > limits[key]) {
          infoErrors[key] = `Max ${limits[key]} characters allowed`;
        }
      });

      if (Object.keys(infoErrors).length > 0) {
        fieldErrors.plan_info = infoErrors;
      }

      if (!plan.status.trim()) fieldErrors.status = "Status is required";

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
      for (const plan of plans) {
        const cleanDiscount = plan.discount.replace('%', '');
        const res = await fetch(`${API_URL}/membership/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: plan.name,
            price: parseFloat(plan.price),
            discount: parseFloat(cleanDiscount),
            final_price: parseFloat(plan.final_price),
            duration: plan.duration,
            status: plan.status,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          toast.error(`❌ Failed to create membership: ${plan.name}`);
          setLoading(false);
          return;
        }

        const membership = await res.json();
        const infoRes = await fetch(`${API_URL}/planInfo/post`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            membership_id: membership.id,
            ...plan.plan_info,
          }),
        });

        if (!infoRes.ok) {
          const errorText = await infoRes.text();
          toast.error(`❌ Failed to create plan info for ${plan.name}`);
          setLoading(false);
          return;
        }
      }

      toast.success("✅ Membership plans and info added successfully!");
      router.push("/admin/membership");
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="membership">
      {loading && (
        <div className="membership__overlay">
          <div className="membership__spinner" />
          <p className="membership__loading-text">Submitting plans...</p>
        </div>
      )}

      <h1 className="membership__title">Add Membership Plans</h1>
      <button type="button" onClick={() => router.push("/admin/membership")} className="membership__btn membership__btn--back">
        <AiOutlineArrowLeft className="membership__icon" /> Back
      </button>

      <form onSubmit={handleSubmit} className="membership__form">
        <div className="membership__table-wrapper">
          <table className="membership__table">
            <thead>
              <tr>
                <th>Name</th><th>Price</th><th>Discount</th><th>Final Price</th><th>Duration</th><th>Plan Info</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan, index) => (
                <tr key={index}>
                  <td>
                    <input type="text" value={plan.name} onChange={(e) => handleChange(index, "name", e.target.value)}
                      className={`membership__input ${errors[index]?.name ? "membership__input--error" : ""}`} placeholder="Plan Name" />
                    {errors[index]?.name && <small className="membership__error-text">{errors[index].name}</small>}
                  </td>
                  <td>
                    <input type="text" value={plan.price} onChange={(e) => handleChange(index, "price", e.target.value)}
                      className={`membership__input ${errors[index]?.price ? "membership__input--error" : ""}`} placeholder="Price" />
                    {errors[index]?.price && <small className="membership__error-text">{errors[index].price}</small>}
                  </td>
                  <td>
                    <div className="membership__discount-wrapper">
                      <input type="text" value={plan.discount.replace('%', '')}
                        onChange={(e) => handleChange(index, "discount", e.target.value.replace('%', ''))}
                        className={`membership__input ${errors[index]?.discount ? "membership__input--error" : ""}`} placeholder="Discount" />
                      <span className="membership__discount-symbol">%</span>
                    </div>
                    {errors[index]?.discount && <small className="membership__error-text">{errors[index].discount}</small>}
                  </td>
                  <td>
                    <input type="text" value={plan.final_price} readOnly
                      className="membership__input membership__input--readonly" placeholder="Final Price" />
                    {errors[index]?.final_price && <small className="membership__error-text">{errors[index].final_price}</small>}
                  </td>
                  <td>
                    <input type="text" value={plan.duration} onChange={(e) => handleChange(index, "duration", e.target.value)}
                      className={`membership__input ${errors[index]?.duration ? "membership__input--error" : ""}`} placeholder="Duration" />
                    {errors[index]?.duration && <small className="membership__error-text">{errors[index].duration}</small>}
                  </td>
                  <td>
                    <div className="membership__info">
                      {[...Array(7)].map((_, i) => {
                        const line = `line_${i + 1}`;
                        const max = i + 1 === 6 ? 60 : 30;
                        return (
                          <div key={line}>
                            <input type="text" maxLength={max}
                              value={plan.plan_info[line]}
                              onChange={(e) => handleChange(index, "plan_info", e.target.value, line)}
                              placeholder={`Plan Info ${line}`}
                              className={`membership__input ${errors[index]?.plan_info?.[line] ? "membership__input--error" : ""}`} />
                            {errors[index]?.plan_info?.[line] && (
                              <small className="membership__error-text">{errors[index].plan_info[line]}</small>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    <select value={plan.status} onChange={(e) => handleChange(index, "status", e.target.value)}
                      className={`membership__input ${errors[index]?.status ? "membership__input--error" : ""}`}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    {errors[index]?.status && <small className="membership__error-text">{errors[index].status}</small>}
                  </td>
                  <td>
                    <button type="button" onClick={() => removeRow(index)} className="membership__btn membership__btn--remove">
                      <AiOutlineDelete className="membership__icon" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="membership__actions">
          <button type="button" onClick={addRow} className="membership__btn membership__btn--add">
            <AiOutlinePlus className="membership__icon" /> Add Plan
          </button>
          <button type="submit" className="membership__btn membership__btn--submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit All"}
          </button>
        </div>
      </form>
    </div>
  );
}
