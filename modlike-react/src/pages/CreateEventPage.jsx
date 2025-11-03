// src/pages/CreateEventPage.jsx (ฉบับสมบูรณ์พร้อม Logic)

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './create-event.module.css';
import Sidebar from '../components/Sidebar';

const CREATE_EVENT_API_URL = `${import.meta.env.VITE_API_BASE_URL}/events/create`;

const CreateEventPage = () => {
  // --- State Management ---
  const [form, setForm] = useState({
  title: "",
  description: "",
  maxStaff: "",        // <-- เพิ่ม
  maxParticipant: "",  // <-- เพิ่ม
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  location: ""
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null); // State สำหรับเก็บไฟล์รูปภาพจริง
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // --- Side Effect for Token ---
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // --- Event Handlers (นำ Logic เดิมมาใส่) ---

  // <-- LOGIC UPDATED
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // เคลียร์ error ทันทีที่ผู้ใช้เริ่มพิมพ์
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  // <-- LOGIC UPDATED
  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setImageFile(file); // เก็บไฟล์จริงไว้
      // เคลียร์ error รูปภาพ
      if (errors.image) {
        setErrors({ ...errors, image: null });
      }
    } else {
      setImagePreview(null);
      setImageFile(null);
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current.click();
  };

  // <-- LOGIC UPDATED
  const validate = (submissionStatus) => {
    const newErrors = {};
    const currentDateTime = new Date();
    let isValid = true;

    // Title
    if (!form.title.trim()) {
      newErrors.title = "Title is required.";
      isValid = false;
    } else if (form.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters.";
      isValid = false;
    }

    // Description
    if (!form.description.trim()) {
      newErrors.description = "Description is required.";
      isValid = false;
    } else if (form.description.length > 2000) {
      newErrors.description = "Description must be less than 2000 characters.";
      isValid = false;
    }

    // Location
    if (!form.location.trim()) {
      newErrors.location = "Location is required.";
      isValid = false;
    } else if (form.location.length > 255) {
      newErrors.location = "Location must be less than 255 characters.";
      isValid = false;
    }

    // Date and Time
    const hasStart = form.startDate && form.startTime;
    const hasEnd = form.endDate && form.endTime;

    if (!hasStart) {
      newErrors.startTime = "Start Date and Time are required.";
      isValid = false;
    } else {
      const startDateTime = new Date(`${form.startDate}T${form.startTime}:00`);
      if (startDateTime <= currentDateTime) {
        newErrors.startTime = "Start Time must be in the future.";
        isValid = false;
      }
    }

    if (!hasEnd) {
      newErrors.endTime = "End Date and Time are required.";
      isValid = false;
    }
    
    if (hasStart && hasEnd) {
        const startDateTime = new Date(`${form.startDate}T${form.startTime}:00`);
        const endDateTime = new Date(`${form.endDate}T${form.endTime}:00`);
        if (endDateTime <= startDateTime) {
            newErrors.endTime = "End Time must be after Start Time.";
            isValid = false;
        }
    }

    // Image Upload
    if (submissionStatus === "submitted" && !imageFile) {
      newErrors.image = "Image is required for submission.";
      isValid = false;
    } else if (imageFile) {
      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(imageFile.type)) {
        newErrors.image = "Invalid file type. Must be JPG or PNG";
        isValid = false;
      } else if (imageFile.size > 2097152) { // 2MB
        newErrors.image = "File size exceeds 2MB limit.";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // <-- LOGIC UPDATED
  const handleSubmit = async (buttonStatus) => {
    const submitStatus = buttonStatus === 'submitted' ? 'Pending' : 'Draft';
    
    if (!validate(buttonStatus)) {
      setPopupMessage("❌ Please fix the validation errors before proceeding.");
      setShowPopup(true);
      return; 
    }

    const token = localStorage.getItem('token');
    if (!token) {
        setPopupMessage("❌ Please log in before saving/submitting an event.");
        setShowPopup(true);
        return;
    }

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('eventInfo', form.description); // เพิ่ม description ที่ขาดไป
    formData.append('maxStaff', form.maxStaff);          // <-- เพิ่ม
    formData.append('maxParticipant', form.maxParticipant); // <-- เพิ่ม
    formData.append('startDateTime', `${form.startDate} ${form.startTime}:00`); 
    formData.append('endDateTime', `${form.endDate} ${form.endTime}:00`);     
    formData.append('location', form.location);
    formData.append('status', submitStatus); 
    
    if (imageFile) {
        formData.append('image', imageFile); 
    }
    
    try {
        const response = await fetch(CREATE_EVENT_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`, 
            },
            body: formData, 
        });

        if (response.ok) {
            const result = await response.json();
            setPopupMessage(result.message || "✅ Event operation successful!");

            // Reset form on success
            setForm({
              title: "",
              description: "",
              maxStaff: "",        // <-- เพิ่มบรรทัดนี้
              maxParticipant: "",  // <-- เพิ่มบรรทัดนี้
              startDate: "",
              startTime: "",
              endDate: "",
              endTime: "",
              location: ""
              });
            setImagePreview(null);
            setImageFile(null); 
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
            setErrors({});

        } else {
            const error = await response.json();
            setPopupMessage(`❌ Failed (${response.status}): ${error.message || "Unknown error"}`);
        }
    } catch (error) {
        setPopupMessage(`❌ Network Error: Could not connect to the server.`);
    }
    setShowPopup(true);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token'); // แก้ไขเป็น 'token' ให้ตรงกัน
    navigate('/login');
  };

  // --- JSX Rendering ---
  return (
    <div className={styles['app-container']}>
      <Sidebar handleLogout={handleLogout}/>

      <div className={styles['main-content-create']}>
        <h1 className={styles['form-title']}>Create Event</h1>

        <div className={styles['form-container']}>
          <div className={styles['form-row-top']}>
            <div className={styles['form-col-left']}>
              <div className={styles['form-group']}>
                <label>Title</label>
                <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="ชื่องาน" maxLength={100} className={errors.title ? styles['input-error'] : ""} />
                {errors.title && <span className={styles['error-message']}>{errors.title}</span>}
              </div>

              <div className={styles['form-group']}>
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="รายละเอียด" rows={6} maxLength={2000} className={errors.description ? styles['input-error'] : ""} />
                {errors.description && <span className={styles['error-message']}>{errors.description}</span>}
              </div>
            </div>

            <div className={styles['form-col-right']}>
              <div className={`${styles['form-group']} ${styles['image-upload-group']}`}>
                <input type="file" accept="image/jpeg, image/png" onChange={handleImageChange} ref={fileInputRef} style={{ display: "none" }} />
                <div className={styles['image-upload-box']} onClick={handleImageUploadClick}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Event preview" />
                  ) : (
                    <div className={styles['image-upload-placeholder']}>
                      <span>Click to upload image</span>
                    </div>
                  )}
                </div>
                {errors.image && <span className={styles['error-message']}>{errors.image}</span>}
              </div>
            </div>
          </div>

          <div className={styles['form-row-bottom']}>

            {/* ===== ส่วนที่เพิ่มเข้ามาสำหรับ Staff และ Participant ===== */}
            {/* ========================================================= */}
            <div className={styles['form-group']}>
              <label>Maximum number of staff</label>
              <input
                type="number"
                name="maxStaff"
                value={form.maxStaff}
                onChange={handleChange}
                placeholder="e.g., 10"
                min="0"
                className={errors.maxStaff ? styles['input-error'] : ""}
              />
              {errors.maxStaff && <span className={styles['error-message']}>{errors.maxStaff}</span>}
            </div>

            <div className={styles['form-group']}>
              <label>Maximum number of participants</label>
              <input
                type="number"
                name="maxParticipant"
                value={form.maxParticipant}
                onChange={handleChange}
                placeholder="e.g., 100"
                min="0"
                className={errors.maxParticipant ? styles['input-error'] : ""}
              />
              {errors.maxParticipant && <span className={styles['error-message']}>{errors.maxParticipant}</span>}
            </div>
            {/* ========================================================= */}
            {/* ================== สิ้นสุดส่วนที่เพิ่ม ================== */}


            <div className={styles['form-group']}>
              <label>Start Time</label>
              <div className={styles['time-inputs']}>
                <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className={errors.startTime ? styles['input-error'] : ""} />
                <input type="time" name="startTime" value={form.startTime} onChange={handleChange} className={errors.startTime ? styles['input-error'] : ""} />
              </div>
              {errors.startTime && <span className={styles['error-message']}>{errors.startTime}</span>}
            </div>

            <div className={styles['form-group']}>
              <label>End Time</label>
              <div className={styles['time-inputs']}>
                <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className={errors.endTime ? styles['input-error'] : ""} />
                <input type="time" name="endTime" value={form.endTime} onChange={handleChange} className={errors.endTime ? styles['input-error'] : ""} />
              </div>
              {errors.endTime && <span className={styles['error-message']}>{errors.endTime}</span>}
            </div>

            <div className={styles['form-group']}>
              <label>Location</label>
              <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="สถานที่จัดงาน" maxLength={255} className={errors.location ? styles['input-error'] : ""} />
              {errors.location && <span className={styles['error-message']}>{errors.location}</span>}
            </div>
          </div>
        </div>

        <div className={styles['form-footer']}>
          <button onClick={() => handleSubmit("draft")} className={styles['btn-secondary']}>Save Draft</button>
          <button onClick={() => handleSubmit("submitted")} className={styles['btn-primary']}>Submit</button>
        </div>
      </div>

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
};

export default CreateEventPage;