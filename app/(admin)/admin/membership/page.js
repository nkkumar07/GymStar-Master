"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { API_URL } from "@/utils/api";
import {
  FaArrowLeft,
  FaPlus,
  FaFilePdf,
  FaFileExcel,
  FaTrash,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaTimes,
} from "react-icons/fa";


export default function MembershipPlanManager({ onEdit, onAdd }) {
  const router = useRouter();

  const [plans, setPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [planInfo, setPlanInfo] = useState(null);
  const [infoLoading, setInfoLoading] = useState(false);


  useEffect(() => {
    fetch(`${API_URL}/membership/get_all`)
      .then((res) => res.json())
      .then((data) => {
        setPlans(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching plans:", err);
        toast.error("❌ Failed to load membership plans.");
        setLoading(false);
      });
  }, []);

  const handleDelete = async (idList) => {
    const confirmed = confirm(
      `Are you sure you want to delete ${idList.length > 1 ? "these plans" : "this plan"}?`
    );
    if (!confirmed) return;

    try {
      // For each membership, first find and delete its plan info
      for (const id of idList) {
        // Fetch plan info for this membership
       const infoRes = await fetch(`${API_URL}/planInfo/get_by_membership_id/${id}`);
        const infoData = await infoRes.json();

        if (infoData && infoData.length > 0) {
          // Delete each plan info record
          for (const info of infoData) {
            await fetch(`${API_URL}/planInfo/delete/${info.id}`, {
              method: "DELETE",
            });
          }
        }
      }

      // Then delete the membership plans
      const deletePlanRequests = idList.map((id) =>
       fetch(`${API_URL}/membership/delete/${id}`, {
          method: "DELETE",
        })
      );

      const planResults = await Promise.all(deletePlanRequests);
      const allPlansDeleted = planResults.every((res) => res.ok);

      if (allPlansDeleted) {
        toast.success("Membership plan(s) and associated info deleted successfully!");
        setPlans(plans.filter((plan) => !idList.includes(plan.id)));
        setSelectedIds([]);
        setSelectAll(false);
      } else {
        toast.error("⚠️ Some plan deletions failed.");
      }
    } catch (err) {
      console.error("Error deleting membership plan(s):", err);
      toast.error("⚠️ Something went wrong during deletion.");
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPlans.map((plan) => plan.id));
    }
    setSelectAll(!selectAll);
  };

  const sortedPlans = [...plans].sort((a, b) => b.id - a.id);

  const filteredPlans = sortedPlans.filter((plan) =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewInfo = async (membershipId) => {
    setInfoLoading(true);
    setShowModal(true);
    try {
      const res = await fetch(`${API_URL}/planInfo/get_by_membership_id/${membershipId}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setPlanInfo(data[0]);
      } else {
        toast.error("ℹ️ No plan info found.");
        setPlanInfo(null);
      }
    } catch (error) {
      console.error("Error fetching plan info:", error);
      toast.error("❌ Failed to load plan info.");
      setPlanInfo(null);
    } finally {
      setInfoLoading(false);
    }
  };


  const handleStatusToggle = async (plan) => {
    const updatedStatus = plan.status === "active" ? "inactive" : "active";
    const updatedPlan = { ...plan, status: updatedStatus };

    try {
      const response = await fetch(`${API_URL}/membership/update/${plan.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPlan),
      });

      if (response.ok) {
        toast.success(`✔️ Plan "${plan.name}" marked as ${updatedStatus}`);
        setPlans((prev) =>
          prev.map((p) => (p.id === plan.id ? { ...p, status: updatedStatus } : p))
        );
      } else {
        toast.error("❌ Failed to update plan status.");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("⚠️ Error updating status.");
    }
  };


  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Membership Plans", 14, 10);
    autoTable(doc, {
      startY: 20,
      head: [["Name", "Price", "Discount", "Final Price", "Duration", "Status"]],
      body: filteredPlans.map((plan) => [
        plan.name,
        `₹${plan.price}`,
        `${plan.discount}%`,
        `₹${plan.final_price}`,
        plan.duration,
        plan.status,
      ]),
    });
    doc.save("membership_plans.pdf");
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredPlans.map((plan) => ({
        Name: plan.name,
        Price: plan.price,
        Discount: `${plan.discount}%`,
        "Final Price": plan.final_price,
        Duration: plan.duration,
        "Plan Info": plan.plan_info,
        Status: plan.status,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "MembershipPlans");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "membership_plans.xlsx");
  };

  const goBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="loader-container">
        <p className="loader-text">🔄 Loading membership plans...</p>
      </div>
    );
  }

  return (
    <div className="membership-manager-wrapper">
  <div className="membership-header-bar">
    <div className="membership-header">
      <button onClick={goBack} className="membership-btn-back">
        <FaArrowLeft /> Back
      </button>
    </div>
    <h2 className="membership-title">Membership Plan Manager</h2>
    <div className="membership-actions">
      <input
        type="text"
        placeholder="Search by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="membership-search-input"
      />
      <Link href="/admin/membership/add">
        <button className="membership-add-button" onClick={onAdd}>
          <FaPlus /> Add
        </button>
      </Link>
      <button onClick={downloadPDF} className="membership-download-button">
        <FaFilePdf /> PDF
      </button>
      <button onClick={downloadExcel} className="membership-download-button">
        <FaFileExcel /> Excel
      </button>
      <button
        onClick={() => {
          if (selectedIds.length === 0) {
            toast.warning("⚠️ Please select at least one plan to delete.");
          } else {
            handleDelete(selectedIds);
          }
        }}
        className="membership-delete-button"
      >
        <FaTrash /> Delete ({selectedIds.length})
      </button>
    </div>
  </div>

  <div className="membership-table-container">
    <table className="membership-table">
      <thead>
        <tr>
          <th>
            <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
          </th>
          <th>Name</th>
          <th>Price</th>
          <th>Discount %</th>
          <th>Final Price</th>
          <th>Duration</th>
          <th>Plan Info</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredPlans.length === 0 ? (
          <tr>
            <td colSpan="9" className="membership-no-results">
              🔍 No plans found matching "{searchTerm}"
            </td>
          </tr>
        ) : (
          filteredPlans.map((plan) => (
            <tr key={plan.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(plan.id)}
                  onChange={() => toggleSelectOne(plan.id)}
                />
              </td>
              <td>{plan.name}</td>
              <td>₹{plan.price}</td>
              <td>{plan.discount}%</td>
              <td>₹{plan.final_price}</td>
              <td>{plan.duration}</td>
              <td>
                <button className="membership-view-button" onClick={() => handleViewInfo(plan.id)}>
                  <FaEye /> View
                </button>
              </td>
              <td>
                <button
                  className={`membership-status-toggle ${plan.status === "active" ? "active" : "inactive"}`}
                  onClick={() => handleStatusToggle(plan)}
                >
                  {plan.status === "active" ? (
                    <><FaCheckCircle /> Active</>
                  ) : (
                    <><FaTimesCircle /> Inactive</>
                  )}
                </button>
              </td>
              <td className="membership-action-buttons">
                <Link href={`/admin/membership/edit/${plan.id}`}>
                  <button className="membership-edit-button" onClick={() => onEdit?.(plan.id)}>
                    <FaEdit />
                  </button>
                </Link>
                <button className="membership-delete-button" onClick={() => handleDelete([plan.id])}>
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>

  {showModal && (
    <div className="membership-modal-overlay">
      <div className="membership-modal-content">
        <button className="membership-close-button" onClick={() => setShowModal(false)}>
          <FaArrowLeft /> Back
        </button>
        <h3 className="membership-modal-title">📋 Plan Information</h3>
        {infoLoading ? (
          <p>🔄 Loading...</p>
        ) : planInfo ? (
          <ul className="membership-plan-info-list">
            {Object.entries(planInfo)
              .filter(([key]) => key.startsWith("line_"))
              .map(([key, value]) => (
                <li key={key}>✅ {value}</li>
              ))}
          </ul>
        ) : (
          <p>No info available for this plan.</p>
        )}
      </div>
    </div>
  )}
</div>



  );
}
