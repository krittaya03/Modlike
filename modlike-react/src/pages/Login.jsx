// src/pages/LoginPage.jsx  (หรือ login.jsx ตามที่คุณตั้งชื่อ)

import React from 'react';
import './login.css'; // 1. Import ไฟล์ CSS ของคุณเข้ามา

// 2. Import รูปภาพทั้งหมดที่ใช้ในหน้านี้
// ***สำคัญ: ตรวจสอบให้แน่ใจว่า path ไปยังไฟล์รูปภาพถูกต้อง***
// แนะนำให้สร้างโฟลเดอร์ src/assets/images แล้วนำรูปไปไว้ข้างใน
import schedulePic from '../assets/images/schedulepic.png';
import logo from '../assets/images/logo (1).png';
import group4 from '../assets/images/Group 4.png';
import group3 from '../assets/images/Group 3.png';
import googleLogo from '../assets/images/google-logo.png';

const LoginPage = () => {

  // 3. สร้างฟังก์ชันสำหรับจัดการการคลิกปุ่ม Login with Google
  const handleGoogleLogin = () => {
    // Redirect ผู้ใช้ไปยัง Backend API เพื่อเริ่มกระบวนการ OAuth
    // ***สำคัญ: ตรวจสอบให้แน่ใจว่าคุณได้สร้างไฟล์ .env และใส่ VITE_API_BASE_URL แล้ว***
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  };

  // 4. แปลง HTML เป็น JSX (เปลี่ยน class เป็น className)
  return (
    // ไม่จำเป็นต้องมี <body> ในคอมโพเนนต์ React
    <div className='logblock'>
      <h1 className="modlike"> MOD LIKE</h1>
      <h2 className="let">Let's make your plan!</h2>

      <h3 className="Welcome">Welcome to the Student Event Planner!</h3>
      <p className="blar">Log in with your university email to explore upcoming events, organize your own, or manage approvals — all in one place.</p>

      <img className="sch" src={schedulePic} alt="schedulepic" />
      <img className="logo" src={logo} alt="logo" />
      <img className="g4" src={group4} alt="" />
      <img className="g3" src={group3} alt="" />

      <div className="recbig"></div>
      <div className="recsmall"></div>

      {/* --- ส่วนของฟอร์มล็อกอินแบบปกติ (ตอนนี้ยังไม่ทำงาน) --- */}
      <form className="login" action="">
        <input className="use" type="email" name="username" placeholder="Username" /> <br />
        <input className="pass" type="password" name="password" placeholder="Password" /> <br />
        
        <input type="checkbox" id="remember" name="remember" />
        <label className="rem" htmlFor="remember">Remember me</label> <br /> {/* htmlFor แทน for */}

        <input className="logbut" type="button" value="Login" /> <br />
      </form>

      <div className="orr">
        <hr className="line1" /> <p className="or">or</p> <hr className="line2" />
      </div>

      {/* --- ส่วนของ Login with Google (ส่วนที่เราจะทำให้ทำงาน) --- */}
      <div> {/* ไม่จำเป็นต้องใช้ <form> อีกต่อไป */}
        {/* 5. เชื่อมต่อฟังก์ชันเข้ากับ event onClick ของปุ่ม */}
        <button type="button" className="loggoo" onClick={handleGoogleLogin}>
          Login with Google
        </button>
        <img id='gg' src={googleLogo} alt="Google Logo" />
      </div>

      <div> {/* ไม่จำเป็นต้องใช้ <form> */}
        <button type="button" className="forgot-btn">Forgot Password?</button>
      </div>
    </div>
  );
};

export default LoginPage;