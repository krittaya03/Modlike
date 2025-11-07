import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/Login"; 

import Dashboard from "./pages/Dashboard";
import AdminDashboard from './pages/AdminDashboard';
import EventListPage1 from "./pages/Eventlistuser";
import CreateEventPage from "./pages/CreateEventPage";
import AdminEventlist from "./pages/AdminEventlist";
import EditEventPage from "./pages/EditEventPage";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from './components/AdminProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/eventlist1"
          element={
            <ProtectedRoute>
              <EventListPage1 />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-event"
          element={
            <ProtectedRoute>
              <CreateEventPage />
            </ProtectedRoute>
          }
        />

                {/* <-- เพิ่ม Route ใหม่นี้ */}
        <Route
          path="/events/edit/:id"
          element={
            <ProtectedRoute>
              <EditEventPage />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/admin/dashboard" 
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } 
        />

        <Route
          path="/admin/eventlist2"
          element={
            <AdminProtectedRoute>
              <AdminEventlist />
            </AdminProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;