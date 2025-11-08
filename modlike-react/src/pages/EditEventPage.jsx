// src/pages/EditEventPage.jsx (ฉบับปรับปรุงใหม่)

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
// ✅ 1. เปลี่ยนไปใช้ CSS Module ที่เราคัดลอกมาใหม่
import styles from "./EditEventPage.module.css"; 
import Sidebar from "../components/Sidebar";

export default function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ✅ 2. ปรับโครงสร้าง State ให้เหมือนกับ CreateEventPage
  const [form, setForm] = useState({
    title: "",
    description: "",
    maxStaff: "",
    maxParticipant: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null); // สำหรับการอัปโหลดรูปใหม่ (ถ้าต้องการ)
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const fileInputRef = useRef(null);

  const api = import.meta.env.VITE_API_BASE_URL;
  const serverBaseUrl = import.meta.env.VITE_SERVER_BASE_URL;
  const token = localStorage.getItem("token");

  // ✅ 3. ปรับ useEffect ให้ดึงข้อมูลและตั้งค่า State ในรูปแบบใหม่
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const res = await fetch(`${api}/events/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch event");
        
        const data = await res.json();
        const event = data.event; // สมมติว่า API คืนค่าเป็น { event: {...} }

        // Helper function แปลงเวลา
        const formatDateTimeForInput = (dateTimeString) => {
          if (!dateTimeString) return { date: '', time: '' };
          const dateObj = new Date(dateTimeString);
          const date = dateObj.toISOString().split('T')[0];
          const time = dateObj.toTimeString().slice(0, 5);
          return { date, time };
        };

        const { date: startDate, time: startTime } = formatDateTimeForInput(event.StartDateTime);
        const { date: endDate, time: endTime } = formatDateTimeForInput(event.EndDateTime);

        // ✅ 4. แก้ปัญหา Controlled/Uncontrolled โดยใช้ || ''
        setForm({
          title: event.EventName || "",
          description: event.EventInfo || "",
          maxStaff: event.MaxStaff || "",
          maxParticipant: event.MaxParticipant || "",
          startDate,
          startTime,
          endDate,
          endTime,
          location: event.Location || "",
        });

        if (event.ImagePath) {
          setImagePreview(`${serverBaseUrl}/${event.ImagePath}`);
        }
      } catch (e) {
        console.error(e);
        setPopupMessage("❌ Error loading event data");
        setShowPopup(true);
      }
    };
    fetchData();
  }, [api, id, token, navigate, serverBaseUrl]);

  // ✅ 5. นำ Event Handlers จาก CreateEventPage มาใช้
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setImageFile(file); // เก็บไฟล์ใหม่ไว้
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const onResubmit = async () => {
    // Note: Add validation logic here if needed, similar to CreateEventPage
    try {
      // ใช้ FormData เพื่อรองรับการอัปเดตไฟล์ภาพในอนาคต (ตอนนี้ยังไม่ได้ส่ง)
      const res = await fetch(`${api}/events/resubmit/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          eventInfo: form.description,
          location: form.location,
          startDateTime: `${form.startDate} ${form.startTime}:00`,
          endDateTime: `${form.endDate} ${form.endTime}:00`,
          maxParticipant: form.maxParticipant || 0,
          maxStaff: form.maxStaff || 0,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Resubmit failed");
      }
      
      setPopupMessage("✅ The event has been edited and resubmitted!");
      setShowPopup(true);
      setTimeout(() => navigate("/eventlist1"), 2000);

    } catch (e) {
      console.error(e);
      setPopupMessage(`❌ Failed to resubmit event: ${e.message}`);
      setShowPopup(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // ✅ 6. ใช้โครงสร้าง JSX เดียวกันกับ CreateEventPage
  return (
    <div className={styles['app-container']}>
      <Sidebar handleLogout={handleLogout} />

      <div className={styles['main-content-create']}>
        {/* เปลี่ยน Title ให้เหมาะสม */}
        <h1 className={styles['form-title']}>Edit Event Information</h1>

        <div className={styles['form-container']}>
          <div className={styles['form-row-top']}>
            <div className={styles['form-col-left']}>
              <div className={styles['form-group']}>
                <label>Title</label>
                <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="Event Name" />
              </div>
              <div className={styles['form-group']}>
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Event Details" rows={6} />
              </div>
            </div>
            <div className={styles['form-col-right']}>
              <div className={`${styles['form-group']} ${styles['image-upload-group']}`}>
                {/* หมายเหตุ: การแก้ไขรูปภาพอาจต้องใช้ Endpoint แยก ถ้า Backend ไม่รองรับ */}
                <input type="file" accept="image/jpeg, image/png" onChange={handleImageChange} ref={fileInputRef} style={{ display: "none" }} />
                <div className={styles['image-upload-box']} onClick={handleImageUploadClick}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Event preview" />
                  ) : (
                    <div className={styles['image-upload-placeholder']}><span>No Image Available</span></div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={styles['form-row-bottom']}>
            <div className={styles['form-group']}>
              <label>Maximum number of staff</label>
              <input type="number" name="maxStaff" value={form.maxStaff} onChange={handleChange} min="0" />
            </div>
            <div className={styles['form-group']}>
              <label>Maximum number of participants</label>
              <input type="number" name="maxParticipant" value={form.maxParticipant} onChange={handleChange} min="0" />
            </div>
            <div className={styles['form-group']}>
              <label>Start Time</label>
              <div className={styles['time-inputs']}>
                <input type="date" name="startDate" value={form.startDate} onChange={handleChange} />
                <input type="time" name="startTime" value={form.startTime} onChange={handleChange} />
              </div>
            </div>
            <div className={styles['form-group']}>
              <label>End Time</label>
              <div className={styles['time-inputs']}>
                <input type="date" name="endDate" value={form.endDate} onChange={handleChange} />
                <input type="time" name="endTime" value={form.endTime} onChange={handleChange} />
              </div>
            </div>
            <div className={styles['form-group']}>
              <label>Location</label>
              <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="Event Location" />
            </div>
          </div>
        </div>

        {/* เปลี่ยนชื่อปุ่มให้สื่อความหมาย */}
        <div className={styles['form-footer']}>
          <button onClick={() => navigate('/eventlist1')} className={styles['btn-secondary']}>Cancel</button>
          <button onClick={onResubmit} className={styles['btn-primary']}>Save Edit</button>
        </div>
      </div>

      {/* Popup ที่ยกมาจาก CreateEventPage */}
      {showPopup && (
        <div className={styles['popup-overlay']}>
          <div className={styles['popup-box']}>
            <p>{popupMessage}</p>
            <button onClick={() => setShowPopup(false)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}