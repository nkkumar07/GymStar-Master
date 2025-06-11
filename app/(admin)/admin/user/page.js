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
import { MdArrowBack, MdDelete, MdEdit, MdDownload } from "react-icons/md";
import { AiOutlinePlus, AiOutlineSearch } from "react-icons/ai";
import { FaFilePdf, FaFileExcel } from "react-icons/fa";

export default function UserManager({ onEdit, onAdd }) {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/users/`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
        toast.error("❌ Failed to load users.");
        setLoading(false);
      });
  }, []);

  const handleDelete = async (idList) => {
    const confirmed = confirm(
      `Are you sure you want to delete ${idList.length > 1 ? "these users" : "this user"}?`
    );
    if (!confirmed) return;

    try {
      const deleteRequests = idList.map((id) =>
        fetch(`${API_URL}/users/delete/${id}`, {
          method: "DELETE",
        })
      );

      const results = await Promise.all(deleteRequests);
      const allSuccessful = results.every((res) => res.ok);

      if (allSuccessful) {
        toast.success("User(s) deleted successfully!");
        setUsers(users.filter((user) => !idList.includes(user.id)));
        setSelectedIds([]);
        setSelectAll(false);
      } else {
        toast.error("⚠️ Some deletions failed.");
      }
    } catch (err) {
      console.error("Error deleting user(s):", err);
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
      setSelectedIds(filteredUsers.map((user) => user.id));
    }
    setSelectAll(!selectAll);
  };

  const sortedUsers = [...users]
    .filter((user) => user.role === "customer")
    .sort(
      (a, b) =>
        new Date(b.updated_at || b.created_at) -
        new Date(a.updated_at || a.created_at)
    );

  const filteredUsers = sortedUsers.filter((user) =>
    `${user.first_name} ${user.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Customer List", 14, 10);
    autoTable(doc, {
      startY: 20,
      head: [["Name", "Email", "Mobile", "Age", "Gender", "Role"]],
      body: filteredUsers.map((user) => [
        `${user.first_name} ${user.last_name}`,
        user.email,
        user.mobile,
        user.age,
        user.gender,
        user.role,
      ]),
    });
    doc.save("customers.pdf");
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredUsers.map((user) => ({
        Name: `${user.first_name} ${user.last_name}`,
        Email: user.email,
        Mobile: user.mobile,
        Age: user.age,
        Gender: user.gender,
        Role: user.role,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "customers.xlsx");
  };

  const goBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="user-loader">
        <p>Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="user-manager">
      <div className="user-header">
        <button onClick={goBack} className="btn-back">
          <MdArrowBack size={20} /> Back
        </button>
        <h2 className="user-title">Customer Manager</h2>
        <div className="user-actions">
          <div className="search-box">
            <AiOutlineSearch />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Link href="/admin/user/add">
            <button className="btn add-btn" onClick={onAdd}>
              <AiOutlinePlus /> Add
            </button>
          </Link>
          <button onClick={downloadPDF} className="btn pdf-btn">
            <FaFilePdf /> PDF
          </button>
          <button onClick={downloadExcel} className="btn excel-btn">
            <FaFileExcel /> Excel
          </button>
          <button
            onClick={() => {
              if (selectedIds.length === 0) {
                toast.warning("⚠️ Please select at least one user to delete.");
              } else {
                handleDelete(selectedIds);
              }
            }}
            className="btn delete-btn"
          >
            <MdDelete /> Delete ({selectedIds.length})
          </button>
        </div>
      </div>

      <div className="user-table-wrapper">
        <table className="user-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-users">
                  No users found matching &quot;{searchTerm}&quot;
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(user.id)}
                      onChange={() => toggleSelectOne(user.id)}
                    />
                  </td>
                  <td>{`${user.first_name} ${user.last_name}`}</td>
                  <td>{user.email}</td>
                  <td>{user.mobile}</td>
                  <td>{user.age}</td>
                  <td>{user.gender}</td>
                  <td>{user.role}</td>
                  <td className="user-actions-cell">
                    <Link href={`/admin/user/edit/${user.id}`}>
                      <button
                        className="btn icon-btn edit-btn"
                        onClick={() => onEdit?.(user.id)}
                      >
                        <MdEdit />
                      </button>
                    </Link>
                    <button
                      className="btn icon-btn delete-btn"
                      onClick={() => handleDelete([user.id])}
                    >
                      <MdDelete />
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
