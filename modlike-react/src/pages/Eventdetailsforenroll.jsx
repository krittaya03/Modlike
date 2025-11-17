import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styles from './Eventdetailsforenroll.module.css';
import Sidebar from '../components/Sidebar';

// ==========================
// Helper Functions (เหมือนเดิม)
// ==========================
const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/600x300.png?text=No+Image+Available';
    return `${import.meta.env.VITE_SERVER_BASE_URL}/${imagePath}`;
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

// ==========================
// Main Component
// ==========================
const EnrollPage = () => {
    const navigate = useNavigate();
    const { eventId } = useParams();

    // --- 1. เพิ่ม State สำหรับเก็บข้อมูลการลงทะเบียน ---
    const [eventDetails, setEventDetails] = useState(null);
    const [enrollmentStatus, setEnrollmentStatus] = useState({
        isEnrolled: false,
        canEnroll: false,
        currentParticipant: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [popupMessage, setPopupMessage] = useState(''); // State สำหรับ Popup

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // --- 2. แก้ไข useEffect ให้เรียกใช้ Endpoint ตัวใหม่ (/detail/:id) ---
    useEffect(() => {
        const fetchEventDetails = async () => {
            if (!eventId) return;

            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');

            try {
                // เปลี่ยนไปเรียก endpoint ใหม่ (/detail/:id)
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/events/detail/${eventId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch event details. Status: ${response.status}`);
                }

                const data = await response.json();
                
                // แยกข้อมูลที่ได้มาเก็บลง State ที่เกี่ยวข้อง
                setEventDetails(data.event);
                setEnrollmentStatus({
                    isEnrolled: data.isEnrolled,
                    canEnroll: data.canEnroll,
                    currentParticipant: data.currentParticipant
                });

            } catch (err) {
                setError(err.message);
                console.error("Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetails();
    }, [eventId]); // ให้ useEffect ทำงานใหม่เมื่อ eventId เปลี่ยน

    // --- 3. สร้างฟังก์ชันสำหรับจัดการการกดปุ่ม Enroll ---
    const handleEnroll = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/events/enroll/${eventId}`, {
                method: 'POST', // ใช้ method POST
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Enrollment failed');
            }
            
            // เมื่อสำเร็จ, แสดง Popup และอัปเดตสถานะในหน้าเว็บทันที
            setPopupMessage(data.message);
            setEnrollmentStatus(prevStatus => ({
                ...prevStatus,
                isEnrolled: true,
                canEnroll: false,
                currentParticipant: prevStatus.currentParticipant + 1
            }));

        } catch (err) {
            console.error("Enrollment Error:", err);
            setPopupMessage(`Error: ${err.message}`);
        }
    };

    // ฟังก์ชันสำหรับปิด Popup
    const closePopup = () => {
        setPopupMessage('');
    };

    // --- Conditional Rendering (เหมือนเดิม แต่เปลี่ยนตัวแปร) ---
    if (loading) return <div className={styles.centeredMessage}>Loading event details...</div>;
    if (error) return <div className={styles.centeredMessage}>Error: {error}</div>;
    if (!eventDetails) return <div className={styles.centeredMessage}>Event not found.</div>;

    // --- 4. ปรับปรุง JSX ให้แสดงผลและทำงานตามเงื่อนไข ---
    return (
        <div className={styles.appContain}>
            {popupMessage && (
                <div className={styles.popupOverlay}>
                    <div className={styles.popupBox}>
                        <p>{popupMessage}</p>
                        <button onClick={closePopup}>OK</button>
                    </div>
                </div>
            )}
            
            <Sidebar handleLogout={handleLogout} />

            <div className={styles.enrollContainer}>
                <h1 className={styles.headEventde}>Event Detail</h1>
                <div className={styles.contentWrapper}>
                    <div className={styles.leftInfo}>
                        <h3>Title</h3>
                        <p className={styles.infoBlock}>{eventDetails.EventName}</p>

                        <h3>Details</h3>
                        <p className={`${styles.infoBlock} ${styles.description}`}>
                            {eventDetails.EventInfo || 'No description provided.'}
                        </p>
                        
                        <div className={styles.gridDetails}>
                            <div>
                                <strong>Date:</strong> 
                                <p>{formatDate(eventDetails.StartDateTime)} - {formatDate(eventDetails.EndDateTime)}</p>
                            </div>
                            <div>
                                <strong>Location:</strong>
                                <p>{eventDetails.Location}</p>
                            </div>
                            <div>
                                <strong>Participants:</strong>
                                <p>{enrollmentStatus.currentParticipant} / {eventDetails.MaxParticipant || 'Unlimited'}</p>
                            </div>
                             
                        </div>
                        <h3>Organizer</h3>
                        <p className={styles.infoBlock}>{eventDetails.OrganizerName || 'N/A'}</p>
                    </div>

                    <div className={styles.rightContent}>
                        <div className={styles.imgPart}>
                            <img src={getImageUrl(eventDetails.ImagePath)} alt={eventDetails.EventName} />
                        </div>
                    </div>

                    <div className={styles.footerenroll}>
                        {/* --- ปุ่ม Enroll ที่แสดงผลตามเงื่อนไข --- */}
                        {enrollmentStatus.isEnrolled ? (
                            <button className={styles.enrolledButton} disabled>Enrolled</button>
                        ) : (
                            <button 
                                onClick={handleEnroll} 
                                className={styles.enrollButton} 
                                disabled={!enrollmentStatus.canEnroll}
                            >
                                {enrollmentStatus.canEnroll ? 'Enroll' : 'Enrollment Closed'}
                            </button>
                        )}
                        <button onClick={() => navigate(-1)} className={styles.backButton}>Back</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnrollPage;