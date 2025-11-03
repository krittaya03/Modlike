// ===============================================
// login.jsx (Final Updated)
// ===============================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate สำหรับการเปลี่ยนหน้า
import styles from './login.module.css';

// --- Import รูปภาพ (เหมือนเดิม) ---
import schedulePic from '../assets/images/schedulepic.png';
import logo from '../assets/images/logo (1).png';
import group4 from '../assets/images/Group 4.png';
import group3 from '../assets/images/Group 3.png';
import googleLogo from '../assets/images/google-logo.png';

const LoginPage = () => {
  // 2. สร้าง State เพื่อจัดการข้อมูลในฟอร์มและข้อความ Error
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Hook สำหรับ redirect

  // --- Logic การ Login Google (เหมือนเดิม) ---
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_SERVER_BASE_URL}/auth/google`;
  };

  // 3. สร้างฟังก์ชันสำหรับจัดการการ Login ด้วย Username/Password
  const handleLocalLogin = async (event) => {
    event.preventDefault(); // ป้องกันการรีเฟรชหน้าเมื่อกด submit form
    setError(''); // ล้างค่า error เก่า

    if (!username || !password) {
      setError('กรุณากรอก Username และ Password');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // ถ้า Server ตอบกลับมาว่าไม่สำเร็จ (status 4xx, 5xx)
        throw new Error(data.message || 'Login failed');
      }

      // Login สำเร็จ
      console.log('Login successful:', data);
      localStorage.setItem('token', data.token); // จัดเก็บ Token ใน localStorage
      
      // ส่งไปหน้า Dashboard พร้อมกับ role
      navigate(`/dashboard?role=${data.role}`);

    } catch (err) {
      console.error('Login Error:', err);
      setError(err.message); // แสดงข้อความ Error ที่ได้จาก Server
    }
  };

  return (
    <div className={styles.logblock}>
      <h1 className={styles.modlike}> MOD LIKE</h1>
      <h2 className={styles.let}>Let's make your plan!</h2>

      <h3 className={styles.Welcome}>Welcome to the Student Event Planner!</h3>
      <p className={styles.blar}>Log in with your university email to explore upcoming events, organize your own, or manage approvals — all in one place.</p>

      <img className={styles.sch} src={schedulePic} alt="schedulepic" />
      <img className={styles.logo} src={logo} alt="logo" />
      <img className={styles.g4} src={group4} alt="" />
      <img className={styles.g3} src={group3} alt="" />

      <div className={styles.recbig}></div>
      <div className={styles.recsmall}></div>
      
      {/* 4. แก้ไข Form ให้เรียกใช้ฟังก์ชัน handleLocalLogin */}
      <form className={styles.login} onSubmit={handleLocalLogin}>
        <input 
          className={styles.use} 
          type="text" // เปลี่ยนเป็น text หรือ email ตามการออกแบบ
          name="username" 
          placeholder="Username"
          value={username} // ผูกค่ากับ state
          onChange={(e) => setUsername(e.target.value)} // อัปเดต state เมื่อมีการพิมพ์
        /> <br />
        <input 
          className={styles.pass} 
          type="password" 
          name="password" 
          placeholder="Password" 
          value={password} // ผูกค่ากับ state
          onChange={(e) => setPassword(e.target.value)} // อัปเดต state เมื่อมีการพิมพ์
        /> <br />
        
        {/* 5. แสดงข้อความ Error ถ้ามี */}
        {error && <p className={styles.errorMessage}>{error}</p>}

        <input type="checkbox" id="remember" name="remember" className={styles.remember} />
        <label className={styles.rem} htmlFor="remember">Remember me</label> <br />

        {/* 6. เปลี่ยน type ของปุ่ม Login เป็น "submit" */}
        <input className={styles.logbut} type="submit" value="Login" /> <br />
      </form>

      <div className={styles.orr}>
        <hr className={styles.line1} /> <p className={styles.or}>or</p> <hr className={styles.line2} />
      </div>

      <div>
        <button type="button" className={styles.loggoo} onClick={handleGoogleLogin}>
          Login with Google
        </button>
        <img className={styles.gg} src={googleLogo} alt="Google Logo" />
      </div>

      <div>
        <button type="button" className={styles['forgot-btn']}>Forgot Password?</button>
      </div>
    </div>
  );
};

export default LoginPage;