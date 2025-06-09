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

// React Icons
import { FaFilePdf, FaFileExcel, FaTrash, FaPlus, FaArrowLeft, FaEdit } from "react-icons/fa";
import { BiSearchAlt } from "react-icons/bi";
import { MdToggleOn, MdToggleOff } from "react-icons/md";

export default function SliderManager({ onEdit, onAdd }) {
  const router = useRouter();
  const [sliders, setSliders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/slider/get`)
      .then((res) => res.json())
      .then((data) => {
        setSliders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching sliders:", err);
        toast.error("❌ Failed to load sliders.");
        setLoading(false);
      });
  }, []);

  const handleDelete = async (idList) => {
    const confirmed = confirm(
      `Are you sure you want to delete ${idList.length > 1 ? "these sliders" : "this slider"}?`
    );
    if (!confirmed) return;

    try {
      const deleteRequests = idList.map((id) =>
        fetch(`${API_URL}/slider/delete/${id}`, {
          method: "DELETE",
        })
      );

      const results = await Promise.all(deleteRequests);
      const allSuccessful = results.every((res) => res.ok);

      if (allSuccessful) {
        toast.success("Slider(s) deleted successfully!");
        setSliders(sliders.filter((slider) => !idList.includes(slider.id)));
        setSelectedIds([]);
        setSelectAll(false);
      } else {
        toast.error("⚠️ Some deletions failed.");
      }
    } catch (err) {
      console.error("Error deleting slider(s):", err);
      toast.error("⚠️ Something went wrong.");
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSliderStatus = async (slider) => {
    const newStatus = slider.status === "active" ? "inactive" : "active";
    const formData = new FormData();
    formData.append("title", slider.title);
    formData.append("subtitle", slider.subtitle);
    formData.append("status", newStatus);

    try {
      const res = await fetch(`${API_URL}/slider/update/${slider.id}`, {
        method: "PUT",
        body: formData,
      });

      if (res.ok) {
        setSliders((prev) =>
          prev.map((s) => (s.id === slider.id ? { ...s, status: newStatus } : s))
        );
        toast.success(`✅ Slider is now ${newStatus}`);
      } else {
        const errData = await res.json();
        console.error("Update error:", errData);
        toast.error("❌ Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("⚠️ Something went wrong");
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSliders.map((slider) => slider.id));
    }
    setSelectAll(!selectAll);
  };

  const sortedSliders = [...sliders].sort((a, b) => b.id - a.id);
  const filteredSliders = sortedSliders.filter((slider) =>
    `${slider.title} ${slider.subtitle}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Slider List", 14, 10);
    autoTable(doc, {
      startY: 20,
      head: [["Title", "Subtitle", "Status"]],
      body: filteredSliders.map((slider) => [
        slider.title,
        slider.subtitle,
        slider.status,
      ]),
    });
    doc.save("sliders.pdf");
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredSliders.map((slider) => ({
        Title: slider.title,
        Subtitle: slider.subtitle,
        Status: slider.status,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sliders");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "sliders.xlsx");
  };

  const goBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="slider-loader-container">
        <p className="slider-loader-text">Loading sliders...</p>
      </div>
    );
  }

  return (
    <div className="slider-manager-container">
      <div className="slider-header">
        <div className="slider-header-left">
          <button onClick={goBack} className="slider-btn-back">
            <FaArrowLeft /> Back
          </button>
        </div>
        <h2 className="slider-title">Slider Manager</h2>
        <div className="slider-actions">
          <div className="slider-search-group">
            <BiSearchAlt className="slider-search-icon" />
            <input
              type="text"
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="slider-search-input"
            />
          </div>
          <Link href="/admin/sliders/add">
            <button className="slider-btn-add" onClick={onAdd}>
              <FaPlus /> Add
            </button>
          </Link>
          <button onClick={downloadPDF} className="slider-btn-download">
            <FaFilePdf /> PDF
          </button>
          <button onClick={downloadExcel} className="slider-btn-download">
            <FaFileExcel /> Excel
          </button>
          <button
            onClick={() => {
              if (selectedIds.length === 0) {
                toast.warning("⚠️ Please select at least one slider to delete.");
              } else {
                handleDelete(selectedIds);
              }
            }}
            className="slider-btn-delete"
          >
            <FaTrash /> Delete ({selectedIds.length})
          </button>
        </div>
      </div>

      <div className="slider-table-wrapper">
        <table className="slider-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>Image</th>
              <th>Title</th>
              <th>Subtitle</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSliders.length === 0 ? (
              <tr>
                <td colSpan="6" className="slider-no-found">
                  No sliders found matching "{searchTerm}"
                </td>
              </tr>
            ) : (
              filteredSliders.map((slider) => (
                <tr key={slider.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(slider.id)}
                      onChange={() => toggleSelectOne(slider.id)}
                    />
                  </td>
                  <td>
                    <img
                      src={`${API_URL}/${slider.image}`}
                      alt={slider.title}
                      className="slider-image-thumb"
                      style={{ width: "80px", borderRadius: "6px" }}
                    />
                  </td>
                  <td>{slider.title}</td>
                  <td>{slider.subtitle}</td>
                  <td>
                    <button
                      className={`slider-status-btn ${slider.status === "active" ? "active" : "inactive"}`}
                      onClick={() => toggleSliderStatus(slider)}
                    >
                      {slider.status === "active" ? <MdToggleOn size={24} /> : <MdToggleOff size={24} />}
                    </button>
                  </td>
                  <td className="slider-action-buttons">
                    <Link href={`/admin/sliders/edit/${slider.id}`}>
                      <button className="slider-btn-edit" onClick={() => onEdit?.(slider.id)}>
                        <FaEdit />
                      </button>
                    </Link>
                    <button
                      className="slider-btn-delete"
                      onClick={() => handleDelete([slider.id])}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
