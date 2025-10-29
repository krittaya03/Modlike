// 1. Imports: นำเข้าโมดูล, hook, CSS, และรูปภาพที่จำเป็น
import React from 'react';
import { useNavigate } from 'react-router-dom'; // hook สำหรับการเปลี่ยนหน้า
import './sidebar.css'; // Import ไฟล์ CSS ที่สร้างไว้

// Import รูปภาพไอคอนทั้งหมด
// ***สำคัญ: ตรวจสอบให้แน่ใจว่า path และชื่อไฟล์ถูกต้อง***
import addi from '../assets/images/addi.png';
import Homei from '../assets/images/Homei.png';
import listi from '../assets/images/tab.png';
import settingi from '../assets/images/settings.png';
import logouti from '../assets/images/Log out.png';

// 2. Component Definition: สร้าง Functional Component ชื่อ Sidebar
// เราจะรับฟังก์ชัน handleLogout มาจาก props เพื่อให้คอมโพเนนต์นี้ยืดหยุ่น
const Adside = ({ handleLogout }) => {
  
  // 3. Hooks: เรียกใช้ useNavigate hook เพื่อให้เราสามารถใช้ฟังก์ชัน navigate ได้
  const navigate = useNavigate();

  // 4. JSX Rendering: ส่วนที่แสดงผล UI ของ Sidebar
  return (
    <nav className="side-nav">
      <div className="nav top">
        <button className="nav-top-item">
          <img src={addi} alt="Main App Icon" />
        </button>
        {/* ใช้ navigate('/path') เพื่อเปลี่ยนหน้าเมื่อคลิก */}
        <button onClick={() => navigate('/admin/dashboard')} className="nav-top-item">
          <img src={Homei} alt="Home" />
        </button>
      </div>

      <div className="nav-menu">
    
        {/* ตัวอย่างการใส่ .active แบบ hardcode ตามโค้ดเดิม */}
        <button onClick={() => navigate('/admin/eventlist2')} className="nav-item active">
          <img src={listi} alt="Event List" />
          <span>Event List</span>
        </button>
        <button onClick={() => navigate('/settings')} className="nav-item">
          <img src={settingi} alt="Settings" />
          <span>Setting</span>
        </button>
        {/* เรียกใช้ฟังก์ชัน handleLogout ที่รับมาจาก props เมื่อคลิก */}
        <button onClick={handleLogout} className="nav-item">
          <img src={logouti} alt="Log out" />
          <span>Log out</span>
        </button>
      </div>
    </nav>
  );
};

// 5. Export: ส่งออกคอมโพเนนต์เพื่อให้ไฟล์อื่นสามารถ import ไปใช้ได้
export default Adside;