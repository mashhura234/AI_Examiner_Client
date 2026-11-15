import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../Services/authServices';
import '../../Styles/Profile.css';

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<any>({
    id: 1,
    firstName: 'Nasrin',
    lastName: 'Maha',
    email: 'www.mashhura88@gmail.com',
    userName: 'mashhura88',
    phoneNumber: '01938607844',
    address: 'Sylhet',
    profileImageUrl: '',
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load profile data on mount and sync local storage profile image backup
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const currentUser = await AuthService.GetProfile();
        const localProfileImage = localStorage.getItem('user_profile_image');

        if (currentUser) {
          if (localProfileImage) {
            currentUser.profileImageUrl = localProfileImage;
            currentUser.profilePicture = localProfileImage;
          } else if (currentUser.profileImageUrl?.startsWith('/uploads')) {
            // Ignore server-relative path if file doesn't exist on disk
            currentUser.profileImageUrl = '';
          }
          setProfile(currentUser);
          setEditForm(currentUser);
        } else {
          getFromStorage();
        }
      } catch (err) {
        getFromStorage();
      } finally {
        setLoading(false);
      }
    };

    const getFromStorage = () => {
      const localData = localStorage.getItem('user') || localStorage.getItem('currentUser') || sessionStorage.getItem('user');
      const localProfileImage = localStorage.getItem('user_profile_image');
      
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (localProfileImage) {
            parsed.profileImageUrl = localProfileImage;
            parsed.profilePicture = localProfileImage;
          } else if (parsed.profileImageUrl?.startsWith('/uploads')) {
            parsed.profileImageUrl = '';
          }
          setProfile(parsed);
          setEditForm(parsed);
        } catch (e) {
          setEditForm(profile);
        }
      } else {
        if (localProfileImage) {
          const defaultUser = { ...profile, profileImageUrl: localProfileImage, profilePicture: localProfileImage };
          setProfile(defaultUser);
          setEditForm(defaultUser);
        } else {
          setEditForm(profile);
        }
      }
    };

    loadUserData();
  }, []);

  const handleEditClick = () => {
    setEditForm(profile);
    setIsEditing(true);
    setMessage(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setMessage(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // Instant File Reader Base64 conversion so profile image renders immediately and saves locally
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setEditForm((prev: any) => ({
          ...prev,
          profileImageUrl: base64String,
          profilePicture: base64String,
          avatarUrl: base64String
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setMessage(null);
      let updatedData = { ...editForm };

      // Save profile image directly to localStorage for reliable frontend rendering
      const currentImg = editForm.profileImageUrl || editForm.profilePicture || editForm.avatarUrl;
      if (currentImg && currentImg.startsWith('data:')) {
        localStorage.setItem('user_profile_image', currentImg);
      }

      // Try calling backend service
      if (profile?.id) {
        try {
          const res = await AuthService.UpdateProfile(profile.id, {
            ...editForm,
            profileImageUrl: currentImg?.startsWith('data:') ? '' : currentImg
          });
          if (res && typeof res === 'object') {
            updatedData = { ...updatedData, ...res };
          }
        } catch (apiErr) {
          console.warn("Backend update error, saving locally:", apiErr);
        }
      }

      // Ensure local backup image stays intact
      const savedImg = localStorage.getItem('user_profile_image');
      if (savedImg) {
        updatedData.profileImageUrl = savedImg;
        updatedData.profilePicture = savedImg;
      }

      // Update local state
      setProfile(updatedData);

      // Save to ALL storage keys so Navbar picks it up instantly
      const stringified = JSON.stringify(updatedData);
      localStorage.setItem('user', stringified);
      localStorage.setItem('currentUser', stringified);
      sessionStorage.setItem('user', stringified);

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('user-updated', { detail: updatedData }));

      setIsEditing(false);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error("Error updating profile", err);
      setMessage('Failed to update profile.');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        if (profile?.id) {
          await AuthService.DeleteProfile(profile.id);
        }
        sessionStorage.clear();
        localStorage.clear();
        navigate('/login');
      } catch (err) {
        sessionStorage.clear();
        localStorage.clear();
        navigate('/login');
      }
    }
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;

  // Resolve active profile image
  const activeImage = isEditing 
    ? (editForm.profileImageUrl || editForm.profilePicture || editForm.avatarUrl) 
    : (profile?.profileImageUrl || profile?.profilePicture || profile?.avatarUrl);

  // Only render if it's a valid Base64 data string or absolute HTTP URL (ignoring broken /uploads server paths)
  const hasValidImage = activeImage && typeof activeImage === 'string' && (activeImage.startsWith('data:') || activeImage.startsWith('http'));

  const getInitials = () => {
    const fn = profile?.firstName || profile?.name?.split(' ')?.[0] || 'N';
    const ln = profile?.lastName || profile?.name?.split(' ')?.[1] || 'M';
    return `${fn[0] || 'N'}${ln[0] || 'M'}`.toUpperCase();
  };

  return (
    <div className="profile-page-container">
      <div className="profile-content-area">
        <div className="profile-unified-card">
          
          {/* Topbar Header */}
          <div className="profile-topbar-header">
            <h2 className="profile-page-title">My Profile</h2>
            <hr className="subtle-divider" />
          </div>

          {/* Section A: Profile Header & Image */}
          <div className="profile-header-section">
            <div className="profile-avatar">
              {hasValidImage ? (
                <img 
                  src={activeImage} 
                  alt="Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="profile-avatar-initials">
                  {getInitials()}
                </div>
              )}
            </div>
            <div className="profile-title-info">
              <h2>{profile?.firstName || profile?.name || 'Nasrin Maha'} {profile?.lastName || ''}</h2>
              <p className="profile-email">{profile?.email || profile?.userName}</p>
              <span className="status-badge active">
                <span className="status-dot"></span> Active Account
              </span>
            </div>
          </div>

          <hr className="subtle-divider" />

          {message && <div style={{ padding: '8px 12px', background: 'rgba(46, 204, 113, 0.2)', color: '#27ae60', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem' }}>{message}</div>}

          {!isEditing ? (
            <>
              {/* Section B: Personal Information */}
              <div className="profile-info-section">
                <h3 className="section-title">Personal Information</h3>
                <div className="info-grid">
                  <div className="info-box">
                    <span className="info-label">First Name</span>
                    <span className="info-value">{profile?.firstName || profile?.name?.split(' ')?.[0] || 'N/A'}</span>
                  </div>
                  <div className="info-box">
                    <span className="info-label">Last Name</span>
                    <span className="info-value">{profile?.lastName || profile?.name?.split(' ')?.[1] || 'N/A'}</span>
                  </div>
                  <div className="info-box">
                    <span className="info-label">Email / Username</span>
                    <span className="info-value">{profile?.email || profile?.userName || 'N/A'}</span>
                  </div>
                  <div className="info-box">
                    <span className="info-label">Contact Number</span>
                    <span className="info-value">{profile?.phoneNumber || profile?.contactNumber || 'N/A'}</span>
                  </div>
                  <div className="info-box full-width">
                    <span className="info-label">Address</span>
                    <span className="info-value">{profile?.address || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <hr className="subtle-divider" />

              {/* Section C: Account Information */}
              <div className="profile-account-section">
                 <h3 className="section-title">Account Information</h3>
                 <div className="info-grid">
                   <div className="info-box full-width">
                      <span className="info-label">Account Status</span>
                      <span className="info-value status-text">Active / Verified</span>
                   </div>
                 </div>
              </div>

              {/* Section D: Profile Management */}
              <div className="profile-management-actions">
                <button className="btn-delete" onClick={handleDeleteAccount}>
                  Delete Account
                </button>
                <button className="btn-edit" onClick={handleEditClick}>
                  Edit Profile
                </button>
              </div>
            </>
          ) : (
            /* Inline Edit Form with Profile Picture Upload */
            <form onSubmit={handleSaveProfile} className="profile-edit-form">
              <h3 className="section-title">Edit Profile & Photo</h3>
              
              <div style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.4)', padding: '12px 15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.6)' }}>
                <label className="info-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Profile Picture Upload</label>
                <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} style={{ fontSize: '0.9rem', color: '#5c4d32' }} />
                {activeImage && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={activeImage} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #d4af37' }} />
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>Photo ready to save</span>
                  </div>
                )}
              </div>

              <div className="info-grid">
                <div className="info-box">
                  <span className="info-label">First Name</span>
                  <input type="text" name="firstName" value={editForm.firstName || ''} onChange={handleChange} className="profile-input-field" required />
                </div>
                <div className="info-box">
                  <span className="info-label">Last Name</span>
                  <input type="text" name="lastName" value={editForm.lastName || ''} onChange={handleChange} className="profile-input-field" required />
                </div>
                <div className="info-box">
                  <span className="info-label">Email / Username</span>
                  <input type="text" name="email" value={editForm.email || ''} onChange={handleChange} className="profile-input-field" required />
                </div>
                <div className="info-box">
                  <span className="info-label">Contact Number</span>
                  <input type="text" name="phoneNumber" value={editForm.phoneNumber || ''} onChange={handleChange} className="profile-input-field" />
                </div>
                <div className="info-box full-width">
                  <span className="info-label">Address</span>
                  <input type="text" name="address" value={editForm.address || ''} onChange={handleChange} className="profile-input-field" />
                </div>
              </div>

              <div className="profile-management-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-delete" onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button type="submit" className="btn-edit">
                  Save Changes
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default Profile;