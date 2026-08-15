import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to format profile image path (if uploaded to backend)
  const formatAvatarUrl = (img) => {
    if (!img) return '/images/avatar.png';
    if (img.startsWith('/uploads/')) {
      return `http://localhost:5000${img}`;
    }
    return img;
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('trailexplorer_token');
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.success && res.data) {
            setUser({
              ...res.data,
              avatar: formatAvatarUrl(res.data.profileImage)
            });
          } else {
            localStorage.removeItem('trailexplorer_token');
            setUser(null);
          }
        } catch (error) {
          localStorage.removeItem('trailexplorer_token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    if (res.success && res.data) {
      setUser({
        ...res.data,
        avatar: formatAvatarUrl(res.data.profileImage)
      });
      return true;
    }
    return false;
  };

  const register = async (name, email, password) => {
    const res = await authService.register(name, email, password);
    if (res.success && res.data) {
      setUser({
        ...res.data,
        avatar: formatAvatarUrl(res.data.profileImage)
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateProfile = async (updatedData) => {
    const res = await userService.updateUserProfile(updatedData);
    if (res.success && res.data) {
      setUser((prev) => ({
        ...prev,
        ...res.data,
        avatar: formatAvatarUrl(res.data.profileImage)
      }));
      return true;
    }
    return false;
  };

  const uploadProfilePhoto = async (file) => {
    const res = await userService.uploadProfilePhoto(file);
    if (res.success && res.data) {
      const newAvatar = formatAvatarUrl(res.data.profileImage);
      setUser((prev) => ({
        ...prev,
        profileImage: res.data.profileImage,
        avatar: newAvatar
      }));
      return res;
    }
    return res;
  };

  const deleteProfilePhoto = async () => {
    const res = await userService.deleteProfilePhoto();
    if (res.success) {
      setUser((prev) => ({
        ...prev,
        profileImage: '/images/avatar.png',
        avatar: '/images/avatar.png'
      }));
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        uploadProfilePhoto,
        deleteProfilePhoto
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
