// 1. Imports: เพิ่มการ import useLocation
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // <--- เพิ่ม useLocation
import './sidebar.css';

// Import รูปภาพไอคอนทั้งหมด
import addi from '../assets/images/addi.png';
import Homei from '../assets/images/Homei.png';
import dayi from '../assets/images/today.png';
import listi from '../assets/images/tab.png';
import settingi from '../assets/images/settings.png';
import logouti from '../assets/images/Log out.png';

const Sidebar = ({ handleLogout }) => {
  
  // 3. Hooks: เรียกใช้ useNavigate และ useLocation
  const navigate = useNavigate();
  const location = useLocation(); // <--- เรียกใช้ useLocation hook

  // --- สร้างตัวแปรเก็บ path ปัจจุบัน ---
  const currentPath = location.pathname; // จะได้ค่าเป็น string เช่น "/dashboard", "/create-event"

  // 4. JSX Rendering: แก้ไข className ให้เป็นแบบ Dynamic
  return (
    <nav className="side-nav">
      <div className="nav top">
        <button className="nav-top-item">
          <img src={addi} alt="Main App Icon" />
        </button>
        <button onClick={() => navigate('/dashboard')} className="nav-top-item">
          <img src={Homei} alt="Home" />
        </button>
      </div>

      <div className="nav-menu">
        {/* ========================================================= */}
        {/* ==================== ส่วนที่แก้ไข ==================== */}
        {/* ========================================================= */}
        <button 
          onClick={() => navigate('/create-event')} 
          // ถ้า path ปัจจุบันคือ '/create-event' ให้เพิ่มคลาส 'active'
          className={`nav-item ${currentPath === '/create-event' ? 'active' : ''}`}
        >
          <img src={dayi} alt="Create Event" />
          <span>Create Event</span>
        </button>
        
        <button 
          onClick={() => navigate('/eventlist1')} 
          // ถ้า path ปัจจุบันคือ '/eventlist1' ให้เพิ่มคลาส 'active'
          className={`nav-item ${currentPath === '/eventlist1' ? 'active' : ''}`}
        >
          <img src={listi} alt="Event List" />
          <span>Event List</span>
        </button>
        
        <button 
          onClick={() => navigate('/settings')} 
          // ถ้า path ปัจจุบันคือ '/settings' ให้เพิ่มคลาส 'active'
          className={`nav-item ${currentPath === '/settings' ? 'active' : ''}`}
        >
          <img src={settingi} alt="Settings" />
          <span>Setting</span>
        </button>
        
        <button onClick={handleLogout} className="nav-item">
          <img src={logouti} alt="Log out" />
          <span>Log out</span>
        </button>
        {/* ========================================================= */}
        {/* ================= สิ้นสุดส่วนที่แก้ไข ================= */}
        {/* ========================================================= */}
      </div>
    </nav>
  );
};

export default Sidebar;