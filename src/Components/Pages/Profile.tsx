import React, { useContext, useEffect, useState } from "react";
import { AuthService } from "../../Services/authServices";
import { AuthContext } from "../Contexts/auth/authContext";
import type { UserProfile } from "../../Models/userModel";
import { CommonService } from "../../Services/commonServices";
import "../../Styles/Profile.css";

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

  // Handle UPDATE submit matching UserUpdateRequest structure
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

  // Handle DELETE account
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
      <div className="profile-page text-center" style={{ padding: "100px 0" }}>
        <div className="profile-spinner"></div>
        <p className="mt-3 text-secondary">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page" style={{ maxWidth: "600px", margin: "60px auto" }}>
        <div className="profile-card profile-error-box text-center">{error}</div>
      </div>
    );
  }

  if (!profile) return null;

  const avatarUrl = getFullImageUrl(profile.profileImageUrl);
  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

  return (
    <div className="profile-page">
      {actionMessage && (
        <div className={`profile-alert profile-alert-${actionMessage.type}`}>
          <span>{actionMessage.text}</span>
          <button type="button" className="profile-alert-close" onClick={() => setActionMessage(null)}>&times;</button>
        </div>
      )}

      {/* SECTION 1: Profile Header */}
      <div className="profile-card profile-header-card mb-4">
        <div className="profile-card-body text-center">
          <div className="mb-3 d-flex justify-content-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName || profile.userName}
                className="profile-avatar-img"
              />
            ) : (
              <div className="profile-avatar-initials">
                {fullName ? fullName.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </div>

          <h2 className="profile-title mb-1">{fullName || "User Profile"}</h2>
          <p className="profile-username mb-3">@{profile.userName}</p>

          <div className="d-flex justify-content-center">
            {profile.userStatus === 1 ? (
              <span className="profile-status-badge active">● Active Account</span>
            ) : (
              <span className="profile-status-badge pending">● Pending Verification</span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Personal Information */}
      <div className="profile-card mb-4">
        <div className="profile-card-body">
          <h4 className="profile-section-heading mb-3">Personal Information</h4>
          <div className="profile-info-grid">
            <div className="profile-detail-item">
              <span className="profile-label">First Name</span>
              <span className="profile-value">{profile.firstName || "Not Provided"}</span>
            </div>
            <div className="profile-detail-item">
              <span className="profile-label">Last Name</span>
              <span className="profile-value">{profile.lastName || "Not Provided"}</span>
            </div>
            <div className="profile-detail-item" style={{ gridColumn: "span 2" }}>
              <span className="profile-label">Email / Username</span>
              <span className="profile-value">{profile.userName}</span>
            </div>
            <div className="profile-detail-item">
              <span className="profile-label">Contact Number</span>
              <span className="profile-value">{profile.contactNumber || "Not Provided"}</span>
            </div>
            <div className="profile-detail-item">
              <span className="profile-label">Address</span>
              <span className="profile-value">{profile.address || "Not Provided"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Account Information */}
      <div className="profile-card mb-4">
        <div className="profile-card-body">
          <h4 className="profile-section-heading mb-3">Account Information</h4>
          <div className="profile-details">
            <div className="profile-detail-item flex-row justify-content-between align-items-center">
              <span className="profile-label">Account Status</span>
              <div>
                {profile.userStatus === 1 ? (
                  <span className="profile-status-badge active">Active / Verified</span>
                ) : (
                  <span className="profile-status-badge pending">Pending Verification</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Profile Management */}
      <div className="profile-card">
        <div className="profile-card-body">
          <h4 className="profile-section-heading mb-3">Profile Management</h4>
          <div className="profile-actions-row">
            <button className="profile-btn profile-btn--danger" onClick={() => setShowDeleteModal(true)}>
              Delete Account
            </button>
            <button className="profile-btn profile-btn--primary" onClick={() => setShowEditModal(true)}>
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL WITH PROFILE IMAGE UPLOAD */}
      {showEditModal && (
        <div className="profile-modal-backdrop">
          <div className="profile-modal-dialog">
            <div className="profile-modal-content">
              <div className="profile-modal-header">
                <h5 className="profile-modal-title">Edit Profile Details</h5>
                <button type="button" className="profile-close-btn" onClick={() => setShowEditModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleUpdateProfile}>
                <div className="profile-modal-body">
                  {/* Profile Image Preview & File Input */}
                  <div className="text-center mb-4">
                    <label className="profile-form-label d-block">Profile Image</label>
                    <div className="d-flex flex-column align-items-center gap-2">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile Preview"
                          className="profile-preview-img"
                        />
                      ) : (
                        <div className="profile-preview-fallback">
                          👤
                        </div>
                      )}
                      <input
                        type="file"
                        name="profileImage"
                        accept="image/*"
                        className="profile-file-input"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>

                  <div className="profile-form-grid">
                    <div>
                      <label className="profile-form-label">First Name</label>
                      <input
                        type="text"
                        className="profile-input"
                        name="firstName"
                        value={editForm.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="profile-form-label">Last Name</label>
                      <input
                        type="text"
                        className="profile-input"
                        name="lastName"
                        value={editForm.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <label className="profile-form-label">Contact Number</label>
                      <input
                        type="text"
                        className="profile-input"
                        name="contactNumber"
                        value={editForm.contactNumber}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <label className="profile-form-label">Address</label>
                      <input
                        type="text"
                        className="profile-input"
                        name="address"
                        value={editForm.address}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                <div className="profile-modal-footer">
                  <button type="button" className="profile-btn profile-btn--secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="profile-btn profile-btn--primary" disabled={isUpdating}>
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
        <div className="profile-modal-backdrop">
          <div className="profile-modal-dialog">
            <div className="profile-modal-content">
              <div className="profile-modal-header danger-header">
                <h5 className="profile-modal-title">Confirm Account Deletion</h5>
                <button type="button" className="profile-close-btn" onClick={() => setShowDeleteModal(false)}>&times;</button>
              </div>
              <div className="profile-modal-body">
                <p className="text-dark" style={{ fontSize: "1.05rem" }}>
                  Are you sure you want to permanently delete your account? This action cannot be undone.
                </p>
              </div>
              <div className="profile-modal-footer">
                <button type="button" className="profile-btn profile-btn--secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="button" className="profile-btn profile-btn--danger" onClick={handleDeleteAccount} disabled={isUpdating}>
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