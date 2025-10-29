// src/pages/AdminDashboard.jsx (ฉบับแก้ไขผสมผสาน)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './admindashboard.module.css'; // <-- ใช้ import เดิมของคุณ

// --- Import รูปภาพ (เหมือนเดิม) ---
import listi from '../assets/images/tab.png';
import settingi from '../assets/images/settings.png';
import logouti from '../assets/images/Log out.png';
import arrowi from '../assets/images/icon.png';
import loci from '../assets/images/location_on.png';
import profile from '../assets/images/profile.webp';

const AdminDashboard = () => {
    // --- ส่วน Logic เดิมของคุณ ---
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dates, setDates] = useState([]);
    const [activeDate, setActiveDate] = useState(null);
    const navigate = useNavigate();

    // --- START: เพิ่ม State และ Logic สำหรับดึงข้อมูล Event ---
    const [events, setEvents] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    // --- END: เพิ่ม State และ Logic ---

    useEffect(() => {
        const handleAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/me`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) throw new Error('Invalid token for admin');
                const data = await response.json();
                 if (data.user.role !== 'admin') {
                    navigate('/dashboard');
                } else {
                    setUser(data.user);
                }
            } catch (error) {
                console.error("Admin Auth Error:", error);
                localStorage.removeItem('token');
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        handleAuth();
    }, [navigate]);

    // --- START: เพิ่ม useEffect สำหรับดึงข้อมูล Event ทั้งหมดของ Admin ---
     useEffect(() => {
        const fetchAllEvents = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setDataLoading(false);
                return;
            }
            try {
                setDataLoading(true);
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/events/admin/all`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch admin events');
                }
                const eventsData = await response.json();
                setEvents(eventsData);
            } catch (error) {
                console.error("Fetch Admin Events Error:", error);
                setEvents([]);
            } finally {
                setDataLoading(false);
            }
        };
        // เรียกใช้ fetchAllEvents ทันที ไม่ต้องรอ user เพราะ handleAuth ทำงานไปแล้ว
        fetchAllEvents();
    }, [navigate]); // ให้ทำงานเมื่อ component โหลด
    // --- END: useEffect ---


    useEffect(() => {
        // ส่วน generateDates เดิมของคุณ
        const generateDates = (daysToShow = 30) => {
            const today = new Date();
            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const generatedDates = [];
            for (let i = 0; i < daysToShow; i++) {
                const currentDate = new Date();
                currentDate.setDate(today.getDate() + i);
                generatedDates.push({
                    fullDate: currentDate.toISOString().split('T')[0],
                    dayName: dayNames[currentDate.getDay()],
                    dayNumber: currentDate.getDate(),
                });
            }
            setDates(generatedDates);
            if (generatedDates.length > 0) setActiveDate(generatedDates[0].fullDate);
        };
        generateDates();
    }, []);

    // --- Handlers เดิมของคุณ ---
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };
    const openProfileModal = () => setIsModalOpen(true);
    const closeProfileModal = () => setIsModalOpen(false);
    const handleDateClick = (date) => setActiveDate(date);

    // --- Helper function สำหรับแสดงสีของสถานะ ---
    const getStatusClass = (status) => {
        switch (status) {
            case 'Approved': return styles.statusApproved;
            case 'Pending': return styles.statusPending;
            case 'Rejected': return styles.statusRejected;
            case 'Cancelled': return styles.statusCancelled;
            default: return styles.statusDraft;
        }
    };

    if (loading) return <div className={styles.loadingContainer}>Loading Admin Dashboard...</div>;
    if (!user) return <div className={styles.loadingContainer}>Could not load admin data. Redirecting...</div>;
    
    return (
      <div className={styles.dashboardContainer}>
        
        <header className={styles.blueblock}>
            <h1 className={styles.welcomeTitle}>Welcome, {user.name} (Admin)</h1>
            <hr className={styles.line} />
            <h3 className={styles.newevent}>All Events</h3>
            <div className={styles.profileIcon} onClick={openProfileModal}>
                <img src={profile} alt="Profile Icon" />
            </div>
        </header>

        {/* --- START: ส่วน Event Cards ที่ถูกแทนที่ --- */}
        <section className={styles.newEventsSection}>
             <div className={styles.eventCardsContainer}>
                {dataLoading && <p style={{ color: 'white', fontSize: '1.2rem' }}>Loading events...</p>}

                {!dataLoading && events.map(event => (
                    <div className={styles.eventCard} key={event.EventID}>
                        <div className={`${styles.statusPill} ${getStatusClass(event.Status)}`}>
                            {event.Status}
                        </div>
                        <img 
                            src={`${import.meta.env.VITE_SERVER_BASE_URL}/${event.ImagePath}`} 
                            alt={event.EventName} 
                        />
                        <div className={styles.eventInfo}>
                            <p className={styles.eventOrganizer}>
                                <span className={`${styles.organizerInitial} ${styles.sInitial}`}>
                                    {event.OrganizerName ? event.OrganizerName.charAt(0).toUpperCase() : 'O'}
                                </span> 
                                {event.OrganizerName || 'Organizer'}
                            </p>
                            <h3>{event.EventName}</h3>
                            <p className={styles.eventDescription}>{event.EventInfo}</p>
                            <button className={styles.detailsBtn}>Details</button>
                        </div>
                    </div>
                ))}
                
                <a href="#" className={styles.moreCard}>
                    <img src={arrowi} alt="More Events" />
                    <span>More</span>
                </a>
            </div>
        </section>
        {/* --- END: ส่วน Event Cards ที่ถูกแทนที่ --- */}


        {/* --- START: ส่วนที่เหลือทั้งหมด คงไว้ตามโครงสร้างเดิมของคุณ --- */}
        <main className={styles.mainContent}>
            <div className={styles.scheduleHeader}>
                <h2 className={styles.mysche}>Event schedule</h2>
                <h2 className={styles.view}>View all</h2>
            </div>
            <div className={styles.scheduleLayout}>
                <div className={styles.dateTabs}>
                    {dates.map((date) => (
                        <div key={date.fullDate} className={`${styles.dateTab} ${activeDate === date.fullDate ? styles.active : ''}`} onClick={() => handleDateClick(date.fullDate)}>
                            <span className={styles.dayName}>{date.dayName}</span>
                            <span className={styles.dayNumber}>{date.dayNumber}</span>
                        </div>
                    ))}
                </div>
                <div className={styles.scheduleCard}>
                    <div className={styles.timeBlock}>
                        <span>08.30</span>
                        <span>12.30</span>
                    </div>
                    <div className={styles.scheduleDetails}>
                        <h3>Sustainability Expo 2025</h3>
                        <p><img src={loci} alt="location icon" /> N16 Learning Exchance Building Floor: 1st floor</p>
                        <button className={styles.detailsBtn}>Details</button>
                    </div>
                </div>
            </div>
        </main>
        
        <nav className={styles.bottomNav}>
            <a onClick={() => navigate('/admin/eventlist2')} className={styles.navItem}>
                <img src={listi} alt="Event List" />
                <span>Event List</span>
            </a>
            <a className={styles.navItem}>
                <img src={settingi} alt="Settings" />
                <span>Setting</span>
            </a>
            <a onClick={handleLogout} className={styles.navItem}>
                <img src={logouti} alt="Log out" />
                <span>Log out</span>
            </a>
        </nav>

        {isModalOpen && (
            <div className={styles.modalOverlay} onClick={closeProfileModal}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.modalCloseButton} onClick={closeProfileModal}>&times;</button>
                    <h2>My Profile</h2>
                    <div className="profile-details-content">
                        <img src={profile} alt="Profile Picture Large" className={styles.modalProfilePic}/>
                        <p><strong>Name:</strong> <span>{user.name}</span></p>
                        <p><strong>Email:</strong> <span>{user.email}</span></p>
                        <p><strong>Role:</strong> <span>{user.role}</span></p>
                    </div>
                </div>
            </div>
        )}
        {/* --- END: ส่วนที่เหลือทั้งหมด --- */}
      </div>
    );
};

export default AdminDashboard;