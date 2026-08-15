import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { TrailProvider } from "./context/TrailContext";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Pages
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import TrailDetails from "./pages/TrailDetails";
import MapPage from "./pages/Map";
import Favorites from "./pages/Favorites";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Achievements from "./pages/Achievements";
import AdminDashboard from "./pages/AdminDashboard";
import About from "./pages/About";

function AppLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/trail/:id" element={<TrailDetails />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <TrailProvider>
        <Router>
          <AppLayout />
        </Router>
      </TrailProvider>
    </AuthProvider>
  );
}
