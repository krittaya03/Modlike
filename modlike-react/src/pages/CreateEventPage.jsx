// src/pages/CreateEventPage.jsx (ฉบับสมบูรณ์ที่สุด)

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './create-event.module.css';
import Sidebar from '../components/Sidebar';

const initialState = {
  title: "",
  description: "",
  maxStaff: "",
  maxParticipant: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  location: ""
};

const CreateEventPage = () => {
  const [form, setForm] = useState(initialState);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const eventIdToEdit = searchParams.get('editId');
  const isEditMode = !!eventIdToEdit;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL;

  const resetForm = () => {
    setForm(initialState);
    setImagePreview(null);
    setImageFile(null);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const fetchEventForEdit = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/events/${eventIdToEdit}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch event data.');
        const data = await response.json();
        const event = data.event;
        const formatDateTimeForInput = (dateTimeString) => {
          if (!dateTimeString) return { date: '', time: '' };
          const dateObj = new Date(dateTimeString);
          const date = dateObj.toISOString().split('T')[0];
          const time = dateObj.toTimeString().slice(0, 5);
          return { date, time };
        };
        const { date: startDate, time: startTime } = formatDateTimeForInput(event.StartDateTime);
        const { date: endDate, time: endTime } = formatDateTimeForInput(event.EndDateTime);
        setForm({
          title: event.EventName || "",
          description: event.EventInfo || "",
          maxStaff: event.MaxStaff || "",
          maxParticipant: event.MaxParticipant || "",
          startDate, startTime, endDate, endTime,
          location: event.Location || "",
        });
        if (event.ImagePath) {
          setImagePreview(`${SERVER_BASE_URL}/${event.ImagePath}`);
        } else {
          setImagePreview(null);
        }
        setImageFile(null);
        setErrors({});
      } catch (error) {
        setPopupMessage(`❌ Error loading event data: ${error.message}`);
        setShowPopup(true);
        resetForm();
      }
    };
    if (isEditMode) {
      fetchEventForEdit();
    } else {
      resetForm();
    }
  }, [eventIdToEdit, isEditMode, navigate, API_BASE_URL, SERVER_BASE_URL]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setImageFile(file);
      if (errors.image) setErrors({ ...errors, image: null });
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const validate = (submissionStatus) => {
    // ✅ ส่วนของ validate ที่คุณถามถึง กลับมาครบถ้วนแล้วครับ
    const newErrors = {};
    let isValid = true;
    const currentDateTime = new Date();

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

    const hasStart = form.startDate && form.startTime;
    const hasEnd = form.endDate && form.endTime;

    if (!hasStart) {
      newErrors.startTime = "Start Date and Time are required.";
      isValid = false;
    }
    if (!hasEnd) {
      newErrors.endTime = "End Date and Time are required.";
      isValid = false;
    }
    
    if (hasStart && hasEnd) {
      const startDateTime = new Date(`${form.startDate}T${form.startTime}`);
      const endDateTime = new Date(`${form.endDate}T${form.endTime}`);
      if (startDateTime <= currentDateTime && !isEditMode) {
        newErrors.startTime = "Start Time must be in the future.";
        isValid = false;
      }
      if (endDateTime <= startDateTime) {
        newErrors.endTime = "End Time must be after Start Time.";
        isValid = false;
      }
    }

    if (submissionStatus === "submitted" && !imageFile && !imagePreview) {
      newErrors.image = "Image is required for submission.";
      isValid = false;
    }

    if (imageFile) {
      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(imageFile.type)) {
        newErrors.image = "Invalid file type. Must be JPG or PNG";
        isValid = false;
      } else if (imageFile.size > 2 * 1024 * 1024) { // 2MB
        newErrors.image = "File size exceeds 2MB limit.";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (buttonStatus) => {
    const submitStatus = buttonStatus === 'submitted' ? 'Pending' : 'Draft';
    if (!validate(buttonStatus)) {
      setPopupMessage("❌ Please fix the validation errors before proceeding.");
      setShowPopup(true);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setPopupMessage("❌ Please log in before saving or submitting an event.");
      setShowPopup(true);
      return;
    }
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('eventInfo', form.description);
    formData.append('maxStaff', form.maxStaff || 0);
    formData.append('maxParticipant', form.maxParticipant || 0);
    formData.append('startDateTime', `${form.startDate} ${form.startTime}:00`);
    formData.append('endDateTime', `${form.endDate} ${form.endTime}:00`);
    formData.append('location', form.location);
    formData.append('status', submitStatus);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    const url = isEditMode ? `${API_BASE_URL}/events/update/${eventIdToEdit}` : `${API_BASE_URL}/events/create`;
    const method = isEditMode ? 'PUT' : 'POST';
    try {
      const response = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      const result = await response.json();
      if (response.ok) {
        const successMessage = result.message || `✅ Event ${isEditMode ? 'updated' : 'created'} successfully!`;
        setPopupMessage(successMessage);
        setTimeout(() => { setShowPopup(false); navigate('/eventlist1'); }, 2000);
      } else {
        setPopupMessage(`❌ Failed (${response.status}): ${result.message || "An unknown error occurred"}`);
      }
    } catch (error) {
      setPopupMessage(`❌ Network Error: Could not connect to the server. Please try again later.`);
    }
    setShowPopup(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className={styles['app-container']}>
      <Sidebar handleLogout={handleLogout} />
      <div className={styles['main-content-create']}>
        <h1 className={styles['form-title']}>{isEditMode ? 'Edit Event' : 'Create Event'}</h1>
        <div className={styles['form-container']}>
          <div className={styles['form-row-top']}>
            <div className={styles['form-col-left']}>
              <div className={styles['form-group']}>
                <label>Title</label>
                <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="Event Name" maxLength={100} className={errors.title ? styles['input-error'] : ""} />
                {errors.title && <span className={styles['error-message']}>{errors.title}</span>}
              </div>
              <div className={styles['form-group']}>
                <label>Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Event Details" rows={6} maxLength={2000} className={errors.description ? styles['input-error'] : ""} />
                {errors.description && <span className={styles['error-message']}>{errors.description}</span>}
              </div>
            </div>
            <div className={styles['form-col-right']}>
              <div className={`${styles['form-group']} ${styles['image-upload-group']}`}>
                <input type="file" accept="image/jpeg, image/png" onChange={handleImageChange} ref={fileInputRef} style={{ display: "none" }} />
                <div className={styles['image-upload-box']} onClick={handleImageUploadClick}>
                  {imagePreview ? (<img src={imagePreview} alt="Event preview" />) : (<div className={styles['image-upload-placeholder']}><span>Click to upload image</span></div>)}
                </div>
                {errors.image && <span className={styles['error-message']}>{errors.image}</span>}
              </div>
            </div>
          </div>
          <div className={styles['form-row-bottom']}>
            <div className={styles['form-group']}>
              <label>Maximum number of staff</label>
              <input type="number" name="maxStaff" value={form.maxStaff} onChange={handleChange} placeholder="e.g., 10" min="0" className={errors.maxStaff ? styles['input-error'] : ""} />
              {errors.maxStaff && <span className={styles['error-message']}>{errors.maxStaff}</span>}
            </div>
            <div className={styles['form-group']}>
              <label>Maximum number of participants</label>
              <input type="number" name="maxParticipant" value={form.maxParticipant} onChange={handleChange} placeholder="e.g., 100" min="0" className={errors.maxParticipant ? styles['input-error'] : ""} />
              {errors.maxParticipant && <span className={styles['error-message']}>{errors.maxParticipant}</span>}
            </div>
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
              <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="Event Location" maxLength={255} className={errors.location ? styles['input-error'] : ""} />
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
          <div className={styles['popup-box']}><p>{popupMessage}</p><button onClick={() => setShowPopup(false)}>OK</button></div>
        </div>
      )}
    </div>
  );
};

export default CreateEventPage;