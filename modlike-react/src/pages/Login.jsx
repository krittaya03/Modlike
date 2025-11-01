

import React from 'react';
import styles from './login.module.css'; // <-- 1. เปลี่ยน Import

// --- Import รูปภาพ (เหมือนเดิม) ---
import schedulePic from '../assets/images/schedulepic.png';
import logo from '../assets/images/logo (1).png';
import group4 from '../assets/images/Group 4.png';
import group3 from '../assets/images/Group 3.png';
import googleLogo from '../assets/images/google-logo.png';

const LoginPage = () => {
  // --- Logic การ Login (เหมือนเดิม) ---
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_SERVER_BASE_URL}/auth/google`;
  };

  return (
    // <-- 2. แก้ไข className ทั้งหมดโดยใช้ object 'styles' -->
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

      <form className={styles.login} action="">
        <input className={styles.use} type="email" name="username" placeholder="Username" /> <br />
        <input className={styles.pass} type="password" name="password" placeholder="Password" /> <br />
        
        {/* 'id' ยังคงอยู่เพื่อให้ 'htmlFor' ทำงานได้ แต่ใช้ 'className' สำหรับการจัดสไตล์ */}
        <input type="checkbox" id="remember" name="remember" className={styles.remember} />
        <label className={styles.rem} htmlFor="remember">Remember me</label> <br />

        <input className={styles.logbut} type="button" value="Login" /> <br />
      </form>

      <div className={styles.orr}>
        <hr className={styles.line1} /> <p className={styles.or}>or</p> <hr className={styles.line2} />
      </div>

      <div>
        <button type="button" className={styles.loggoo} onClick={handleGoogleLogin}>
          Login with Google
        </button>
        {/* ใช้ className สำหรับการจัดสไตล์ แทน id */}
        <img className={styles.gg} src={googleLogo} alt="Google Logo" />
      </div>

      <div>
        <button type="button" className={styles['forgot-btn']}>Forgot Password?</button>
      </div>
    </div>
  );
};

export default LoginPage;



// ทดลองใช้ git hub 01/11/25