import React, { useContext, useEffect, useState } from "react";
import { AuthService } from "../../Services/authServices";
import { AuthContext } from "../Contexts/auth/authContext";
import type { UserProfile } from "../../Models/userModel";
import { CommonService } from "../../Services/commonServices";

const API_BASE_URL = "https://localhost:7240";

export const Profile: React.FC = () => {
  const { state, dispatch } = useContext(AuthContext);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "danger" } | null>(null);

  // Edit Form State & Image Preview
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    contactNumber: "",
    address: "",
    profileImage: null as File | null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const data = await AuthService.GetProfile();
      setProfile(data);

      // Pre-fill edit form
      if (data) {
        setEditForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          contactNumber: data.contactNumber || "",
          address: data.address || "",
          profileImage: null,
        });
        setImagePreview(data.profileImageUrl ? getFullImageUrl(data.profileImageUrl) : null);
      }
    } catch (err: any) {
      console.error("Profile Fetch Error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to load profile details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Helper to format local API URLs
  const getFullImageUrl = (relativePath?: string) => {
    if (!relativePath || relativePath.trim() === "") return null;
    const cleanPath = relativePath.replace(/\\/g, "/");
    if (cleanPath.startsWith("http")) return cleanPath;
    return `${API_BASE_URL}${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setEditForm((prev) => ({
        ...prev,
        profileImage: file,
      }));

      // Generate local preview URL
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  // 1. Handle UPDATE submit matching UserUpdateRequest structure
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsUpdating(true);
    setActionMessage(null);

    const formData = new FormData();
    formData.append("firstName", editForm.firstName);
    formData.append("lastName", editForm.lastName);
    formData.append("contactNumber", editForm.contactNumber);
    formData.append("address", editForm.address);
    
    if (editForm.profileImage) {
      formData.append("profileImage", editForm.profileImage);
    }

    try {
      await AuthService.UpdateProfile(profile.id, formData as any);
      setActionMessage({
        text: "Profile updated successfully!",
        type: "success",
      });
      setShowEditModal(false);
      fetchProfileData(); // Refresh UI
    } catch (err: any) {
      setActionMessage({
        text: err.response?.data?.message || "Failed to update profile.",
        type: "danger",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // 2. Handle DELETE account
  const handleDeleteAccount = async () => {
    if (!profile) return;
    setIsUpdating(true);

    try {
      await AuthService.DeleteProfile(profile.id);
      alert("Account deleted successfully.");
      CommonService.ClearSession(); // Clears session storage tokens
      if (dispatch) dispatch({ type: "Logout", data: null }); // Clear auth session
      window.location.href = "/login";
    } catch (err: any) {
      console.error("Delete Error:", err);
      alert("Failed to delete account. Please try again.");
    } finally {
      setIsUpdating(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5" style={{ maxWidth: "500px" }}>
        <div className="alert alert-danger text-center">{error}</div>
      </div>
    );
  }

  if (!profile) return null;

  const avatarUrl = getFullImageUrl(profile.profileImageUrl);
  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

  return (
    <div className="container mt-5 mb-5" style={{ maxWidth: "550px" }}>
      {actionMessage && (
        <div className={`alert alert-${actionMessage.type} alert-dismissible fade show`} role="alert">
          {actionMessage.text}
          <button type="button" className="btn-close" onClick={() => setActionMessage(null)}></button>
        </div>
      )}

      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-body p-4 text-center">
          
          {/* Full Name Displayed Above Profile Image */}
          <h3 className="fw-bold mb-3">{fullName || "User Profile"}</h3>

          {/* Profile Avatar */}
          <div className="mb-3 d-flex justify-content-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName || profile.userName}
                className="rounded-circle img-thumbnail shadow-sm"
                style={{ width: "130px", height: "130px", objectFit: "cover" }}
              />
            ) : (
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow-sm"
                style={{ width: "130px", height: "130px", fontSize: "3rem", fontWeight: "bold" }}
              >
                {fullName ? fullName.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </div>

          <p className="text-muted mb-2">@{profile.userName}</p>

          <span className="badge bg-primary px-3 py-2 mb-3">User</span>

          <hr />

          {/* Personal Details */}
          <div className="text-start">
            <div className="mb-2">
              <strong className="text-secondary">Email / Username:</strong>
              <div className="text-dark">{profile.userName}</div>
            </div>

            <div className="mb-2">
              <strong className="text-secondary">Contact Number:</strong>
              <div className="text-dark">{profile.contactNumber || "Not Provided"}</div>
            </div>

            <div className="mb-2">
              <strong className="text-secondary">Address:</strong>
              <div className="text-dark">{profile.address || "Not Provided"}</div>
            </div>

            <div className="mt-3">
              <strong className="text-secondary">Account Status:</strong>
              <div>
                {profile.userStatus === 1 ? (
                  <span className="badge bg-success">Active / Verified</span>
                ) : (
                  <span className="badge bg-warning text-dark">Pending Verification</span>
                )}
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
              <button className="btn btn-outline-danger btn-sm" onClick={() => setShowDeleteModal(true)}>
                Delete Account
              </button>
              <button className="btn btn-primary" onClick={() => setShowEditModal(true)}>
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL WITH PROFILE IMAGE UPLOAD */}
      {showEditModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Edit Profile Details</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleUpdateProfile}>
                <div className="modal-body">
                  {/* Profile Image Preview & File Input */}
                  <div className="text-center mb-3">
                    <label className="form-label fw-semibold d-block">Profile Image</label>
                    <div className="d-flex flex-column align-items-center">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile Preview"
                          className="rounded-circle mb-2 shadow-sm object-fit-cover"
                          style={{ width: "80px", height: "80px" }}
                        />
                      ) : (
                        <div
                          className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center mb-2"
                          style={{ width: "80px", height: "80px" }}
                        >
                          <i className="bi bi-person fs-3"></i>
                        </div>
                      )}
                      <input
                        type="file"
                        name="profileImage"
                        accept="image/*"
                        className="form-control form-control-sm"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="firstName"
                        value={editForm.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="lastName"
                        value={editForm.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Contact Number</label>
                      <input
                        type="text"
                        className="form-control"
                        name="contactNumber"
                        value={editForm.contactNumber}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Address</label>
                      <input
                        type="text"
                        className="form-control"
                        name="address"
                        value={editForm.address}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Confirm Account Deletion</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to permanently delete your account? This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteAccount} disabled={isUpdating}>
                  {isUpdating ? "Deleting..." : "Yes, Delete My Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;