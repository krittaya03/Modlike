import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAdminStatus = async () => {
      // 1. ตรวจสอบ Token ใน localStorage ก่อน
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        // ไม่ต้องทำอะไรต่อ ปล่อยให้ Logic ด้านล่างจัดการ redirect ไป /login
        return; 
      }

      // 2. ถ้ามี Token, ส่งไปตรวจสอบที่ Server
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // ถ้า Token ไม่ถูกต้อง (เช่น หมดอายุ)
          throw new Error('Invalid or expired token.');
        }

        const data = await response.json();
        
        // 3. ตรวจสอบ Role จากข้อมูลที่ได้กลับมา
        if (data.user && data.user.role === 'admin') {
          setIsAdmin(true); // อนุญาตให้ผ่าน
        } else {
          // มี Token แต่ไม่ใช่ Admin
          setIsAdmin(false);
          alert('Access Denied: You do not have administrator privileges.'); // แจ้งเตือนผู้ใช้
        }
      } catch (error) {
        console.error('Admin verification failed:', error);
        localStorage.removeItem('token'); // ลบ Token ที่ใช้ไม่ได้ทิ้ง
        setIsAdmin(false);
      } finally {
        // 4. เมื่อกระบวนการทั้งหมดเสร็จสิ้น ให้หยุด Loading
        setIsLoading(false);
      }
    };

    verifyAdminStatus();
  }, []); // ทำงานแค่ครั้งเดียวเมื่อ Component ถูก mount

  // --- ส่วนจัดการการแสดงผล ---

  // สถานะที่ 1: กำลังตรวจสอบสิทธิ์, แสดงหน้า Loading
  if (isLoading) {
    return <div className="loading-container">Verifying administrative access...</div>;
  }

  // สถานะที่ 2: ตรวจสอบเสร็จแล้ว และเป็น Admin จริง
  if (isAdmin) {
    return children; // แสดง Component ที่ต้องการ (เช่น <AdminDashboard />)
  }

  // สถานะที่ 3: ตรวจสอบเสร็จแล้ว แต่ "ไม่ใช่" Admin (หรือไม่ล็อกอินเลย)
  // เราจะส่งผู้ใช้ที่ล็อกอินแล้วแต่ไม่ใช่แอดมินกลับไปที่แดชบอร์ดปกติ
  // และส่งผู้ที่ยังไม่ได้ล็อกอินไปที่หน้าล็อกอิน
  const token = localStorage.getItem('token');
  if (!token) {
      return <Navigate to="/login" replace />;
  } else {
      return <Navigate to="/dashboard" replace />;
  }
};

export default AdminProtectedRoute;