// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // 1. ตรวจสอบ "ตั๋วในกระเป๋า" (localStorage) เหมือนเดิม
  const tokenInStorage = localStorage.getItem('token');

  // 2. (ส่วนที่เพิ่มเข้ามา) ตรวจสอบ "ตั๋วในมือ" (URL) ด้วย!
  const params = new URLSearchParams(window.location.search);
  const tokenInUrl = params.get('token');

  // 3. ถ้าไม่มีตั๋ว "ทั้งในกระเป๋าและในมือ" ถึงจะไล่กลับไปหน้า Login
  if (!tokenInStorage && !tokenInUrl) {
    return <Navigate to="/login" />;
  }

  // 4. ถ้ามีตั๋วอย่างน้อยหนึ่งที่ ให้ผ่านเข้าไปได้เลย
  // (เพื่อให้ Dashboard.jsx มีเวลาทำงานเพื่อเอาตั๋วในมือไปเก็บใส่กระเป๋า)
  return children;
};

export default ProtectedRoute;