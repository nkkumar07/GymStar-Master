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

import { FiArrowLeft, FiPlus, FiFileText, FiFile, FiTrash2, FiEdit } from "react-icons/fi";

export default function TrainerManager({ onEdit, onAdd }) {
  const router = useRouter();
  const [trainers, setTrainers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/trainer/get_all`)
      .then((res) => res.json())
      .then((data) => {
        setTrainers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching trainers:", err);
        toast.error("❌ Failed to load trainers.");
        setLoading(false);
      });
  }, []);

  const handleDelete = async (idList) => {
    const confirmed = confirm(
      `Are you sure you want to delete ${idList.length > 1 ? "these trainers" : "this trainer"}?`
    );
    if (!confirmed) return;

    try {
      const deleteRequests = idList.map((id) =>
        fetch(`${API_URL}/trainer/delete/${id}`, {
          method: "DELETE",
        })
      );

      const results = await Promise.all(deleteRequests);
      const allSuccessful = results.every((res) => res.ok);

      if (allSuccessful) {
        toast.success("Trainer(s) deleted successfully!");
        setTrainers(trainers.filter((trainer) => !idList.includes(trainer.id)));
        setSelectedIds([]);
        setSelectAll(false);
      } else {
        toast.error("⚠️ Some deletions failed.");
      }
    } catch (err) {
      console.error("Error deleting trainer(s):", err);
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

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTrainers.map((trainer) => trainer.id));
    }
    setSelectAll(!selectAll);
  };

  const sortedTrainers = [...trainers].sort((a, b) => b.id - a.id);

  const filteredTrainers = sortedTrainers.filter((trainer) =>
    trainer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Trainer List", 14, 10);
    autoTable(doc, {
      startY: 20,
      head: [["Name", "Designation", "Mobile", "Twitter", "Facebook", "LinkedIn"]],
      body: filteredTrainers.map((trainer) => [
        trainer.name,
        trainer.designation,
        trainer.mobile_number,
        trainer.twitter_link,
        trainer.fb_link,
        trainer.linkedin_link,
      ]),
    });
    doc.save("trainers.pdf");
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredTrainers.map((trainer) => ({
        Name: trainer.name,
        Designation: trainer.designation,
        Mobile: trainer.mobile_number,
        Twitter: trainer.twitter_link,
        Facebook: trainer.fb_link,
        LinkedIn: trainer.linkedin_link,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trainers");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "trainers.xlsx");
  };

  const goBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="tm-loader-container">
        <p className="tm-loader-text">🔄 Loading trainers...</p>
      </div>
    );
  }

  return (
    <div className="tm-wrapper">
      <div className="tm-header-bar">
        <div className="tm-header-left">
          <button onClick={goBack} className="tm-btn-back">
            <FiArrowLeft size={18} /> Back
          </button>
        </div>
        <h2 className="tm-title">Trainer Manager</h2>
        <div className="tm-actions">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="tm-search-input"
          />
          <Link href="/admin/trainers/add">
            <button className="tm-add-button" onClick={onAdd} type="button">
              <FiPlus size={18} /> Add
            </button>
          </Link>
          <button onClick={downloadPDF} className="tm-download-button" type="button">
            <FiFileText size={18} /> Download PDF
          </button>
          <button onClick={downloadExcel} className="tm-download-button" type="button">
            <FiFile size={18} /> Download Excel
          </button>
          <button
            onClick={() => {
              if (selectedIds.length === 0) {
                toast.warning("⚠️ Please select at least one trainer to delete.");
              } else {
                handleDelete(selectedIds);
              }
            }}
            className="tm-delete-button"
            type="button"
          >
            <FiTrash2 size={18} /> Delete Selected ({selectedIds.length})
          </button>
        </div>
      </div>

      <div className="tm-table-container">
        <table className="tm-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
              </th>
              <th>Image</th>
              <th>Name</th>
              <th>Designation</th>
              <th>Mobile</th>
              <th>Twitter</th>
              <th>Facebook</th>
              <th>LinkedIn</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrainers.length === 0 ? (
              <tr>
                <td colSpan="9" className="tm-no-trainers">
                  🔍 No trainers found matching &quot;{searchTerm}&quot;
                </td>
              </tr>
            ) : (
              filteredTrainers.map((trainer) => (
                <tr key={trainer.id} className="tm-row">
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(trainer.id)}
                      onChange={() => toggleSelectOne(trainer.id)}
                    />
                  </td>
                  <td>
                    <img
                      src={`${API_URL}${trainer.image}`}
                      alt={trainer.name}  // This is correct
                      className="tm-trainer-img"
                      style={{ width: "50px", height: "50px", borderRadius: "8px" }}
                    />

                  </td>
                  <td>{trainer.name}</td>
                  <td>{trainer.designation}</td>
                  <td>{trainer.mobile_number}</td>
                  <td>
                    <a href={trainer.twitter_link} target="_blank" rel="noopener noreferrer">
                      Twitter
                    </a>
                  </td>
                  <td>
                    <a href={trainer.fb_link} target="_blank" rel="noopener noreferrer">
                      Facebook
                    </a>
                  </td>
                  <td>
                    <a href={trainer.linkedin_link} target="_blank" rel="noopener noreferrer">
                      LinkedIn
                    </a>
                  </td>
                  <td className="tm-action-buttons">
                    <Link href={`/admin/trainers/edit/${trainer.id}`}>
                      <button
                        className="tm-edit-button"
                        onClick={() => onEdit?.(trainer.id)}
                        type="button"
                      >
                        <FiEdit size={16} />
                      </button>
                    </Link>
                    <button
                      className="tm-delete-button"
                      onClick={() => handleDelete([trainer.id])}
                      type="button"
                    >
                      <FiTrash2 size={16} />
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
