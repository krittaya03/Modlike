// src/pages/Dashboard.jsx (ฉบับแก้ไขสมบูรณ์)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './dashboard.module.css'; // <-- 1. เปลี่ยน Import
import { Link } from 'react-router-dom';

// --- Import รูปภาพ (กรุณาตรวจสอบ Path ให้ถูกต้อง) ---
import dayi from '../assets/images/today.png';
import listi from '../assets/images/tab.png';
import settingi from '../assets/images/settings.png';
import logouti from '../assets/images/Log out.png';
import arrowi from '../assets/images/icon.png';
import loci from '../assets/images/location_on.png';
import profile from '../assets/images/profile.webp';

const Dashboard = () => {
    // --- ส่วน Logic ทั้งหมด (เหมือนเดิม) ---
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dates, setDates] = useState([]);
    const [activeDate, setActiveDate] = useState(null);
    const navigate = useNavigate();


    // ===============================================================
    // START: เพิ่ม State ที่ขาดไปสำหรับเก็บข้อมูล Events
    // ===============================================================
    const [events, setEvents] = useState([]);
    const [dataLoading, setDataLoading] = useState(true); // <-- นี่คือตัวแปรที่ Error แจ้งว่าหาไม่เจอ
    // ===============================================================
    // END: เพิ่ม State
    // ===============================================================

    //16-11-25
    // ===============================================================
    // START: เพิ่ม State สำหรับเก็บข้อมูล Event ที่ User ลงทะเบียนไว้
    // ===============================================================
    const [enrolledEvents, setEnrolledEvents] = useState([]);
    const [scheduleLoading, setScheduleLoading] = useState(true);
    // ===============================================================
    // END: เพิ่ม State
    // ===============================================================


    useEffect(() => {
        const handleAuth = async () => {
            const params = new URLSearchParams(window.location.search);
            const tokenFromUrl = params.get('token');
            let effectiveToken = tokenFromUrl || localStorage.getItem('token');
            if (tokenFromUrl) {
                localStorage.setItem('token', tokenFromUrl);
                window.history.replaceState({}, document.title, "/dashboard");
            }
            if (!effectiveToken) {
                navigate('/login');
                return;
            }
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/me`, {
                    headers: { 'Authorization': `Bearer ${effectiveToken}` },
                });
                if (!response.ok) throw new Error('Invalid token');
                const data = await response.json();
            if (data.user.role === 'admin') {
                navigate('/admin/dashboard', { replace: true }); 
            } else {
                setUser(data.user);
            }
            } catch (error) {
                console.error("Auth Error:", error);
                localStorage.removeItem('token');
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        handleAuth();
    }, [navigate]);

    // ===============================================================
    // START: เพิ่ม useEffect ใหม่สำหรับดึงข้อมูล Events จาก API
    // ===============================================================
    useEffect(() => {
        const fetchApprovedEvents = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setDataLoading(false);
                return;
            }

            try {
                setDataLoading(true); // เริ่มโหลดข้อมูล
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/events/approved`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch events');
                }
                const eventsData = await response.json();
                setEvents(eventsData); // นำข้อมูลที่ได้ไปเก็บใน state
            } catch (error) {
                console.error("Fetch Events Error:", error);
                setEvents([]); // กรณี Error ให้ข้อมูลเป็นค่าว่าง
            } finally {
                setDataLoading(false); // โหลดข้อมูลเสร็จสิ้น (ไม่ว่าจะสำเร็จหรือล้มเหลว)
            }
        };

        fetchApprovedEvents();
    }, []); // ให้ useEffect นี้ทำงานแค่ครั้งเดียวตอน component โหลดเสร็จ
    // ===============================================================
    // END: เพิ่ม useEffect
    // ===============================================================


    // ===============================================================
    // START: เพิ่ม useEffect ใหม่สำหรับดึงข้อมูล Enrolled Events (16-11-25)
    // ===============================================================
    useEffect(() => {
        // จะเริ่มทำงานต่อเมื่อมีข้อมูล user แล้วเท่านั้น
        if (!user) return;

        const fetchEnrolledEvents = async () => {
            setScheduleLoading(true);
            const token = localStorage.getItem('token');
            try {
                // เรียก API endpoint ใหม่ที่เราสร้างไว้
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/enrolled-events`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch enrolled events');
                }
                const data = await response.json();
                setEnrolledEvents(data); // เก็บข้อมูล event ที่ลงทะเบียนไว้ใน state
            } catch (error) {
                console.error("Fetch Enrolled Events Error:", error);
                setEnrolledEvents([]);
            } finally {
                setScheduleLoading(false);
            }
        };

        fetchEnrolledEvents();
    }, [user]); // ให้ useEffect นี้ทำงานใหม่ทุกครั้งที่ข้อมูล user เปลี่ยน (ซึ่งคือตอน login สำเร็จ)
    // ===============================================================
    // END: เพิ่ม useEffect
    // ===============================================================



    useEffect(() => {
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };
    const openProfileModal = () => setIsModalOpen(true);
    const closeProfileModal = () => setIsModalOpen(false);
    const handleDateClick = (date) => setActiveDate(date);

    if (loading) return <div className={styles.loadingContainer}>Loading...</div>;
    if (!user) return <div className={styles.loadingContainer}>Could not load user data. Redirecting...</div>;

    // --- Helper Function สำหรับจัดรูปแบบเวลา --- 16-11-25
    const formatTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    // --- กรองกิจกรรมที่ลงทะเบียนไว้ให้ตรงกับวันที่เลือก --- 16-11-25
    const filteredSchedule = enrolledEvents.filter(event => {
        // เปรียบเทียบเฉพาะส่วน 'YYYY-MM-DD' ของวันที่
        if (!activeDate || !event.StartDateTime) return false;
        return event.StartDateTime.startsWith(activeDate);
    });


    return (
      <div className={styles.dashboardContainer}>
        
        <header className={styles.blueblock}>
            <h1 className={styles.welcomeTitle}>Welcome, {user.name}</h1>
            <hr className={styles.line} />
            <h3 className={styles.newevent}>New event</h3>
            
            <div className={styles.profileIcon} onClick={openProfileModal}>
                <img src={profile} alt="Profile Icon" />
            </div>
        </header>

        {/* วางโค้ดนี้แทนที่ <section>...</section> เดิมใน Dashboard.jsx */}

        <section className={styles.newEventsSection}>
            <div className={styles.eventCardsContainer}>
                {/* --- START: แสดงผล Event Cards แบบไดนามิก --- */}
                
                {/* แสดงข้อความ "Loading..." ขณะกำลังดึงข้อมูล */}
                {dataLoading && <p>Loading events...</p>}

                {/* เมื่อโหลดเสร็จแล้ว ให้ map ข้อมูล event มาสร้าง card */}
                {/* ใช้ .slice(0, 4) เพื่อแสดงแค่ 4 กิจกรรมล่าสุด */}
                {!dataLoading && events.slice(0, 4).map(event => (
                    <div className={styles.eventCard} key={event.EventID}>
                        
                        {/* แก้ไข URL ของรูปภาพให้ถูกต้อง */}
                        <img 
                            src={`${import.meta.env.VITE_SERVER_BASE_URL}/${event.ImagePath}`} 
                            alt={event.EventName} 
                        />

                        <div className={styles.eventInfo}>
                            <p className={styles.eventOrganizer}>
                                {/* ดึงตัวอักษรแรกของชื่อผู้จัดมาแสดง */}
                                <span className={`${styles.organizerInitial} ${styles.sInitial}`}>
                                    {event.OrganizerName ? event.OrganizerName.charAt(0).toUpperCase() : 'O'}
                                </span> 
                                {/* แสดงชื่อผู้จัดเต็ม */}
                                {event.OrganizerName || 'Organizer'}
                            </p>

                            {/* แสดงชื่อ Event */}
                            <h3>{event.EventName}</h3>

                            {/* แสดงข้อมูล Event */}
                            <p className={styles.eventDescription}>{event.EventInfo}</p>
                            
                            {/* <button className={styles.detailsBtn}>Details</button> */}
                            <Link to={`/eventenroll/${event.EventID}`} className={`${styles.detailsBtn} nostyle-link`}>
                            Details
                            </Link>
                        </div>
                    </div>
                ))}
                {/* --- END: แสดงผล Event Cards --- */}
                
                {/* การ์ด "More" ที่เป็นลิงก์ยังคงอยู่เหมือนเดิม */}
                <Link to="/eventlist1" className={styles.moreCard}>
                    <img src={arrowi} alt="More Events" />
                    <span>More</span>
                </Link>
            </div>
        </section>

        <main className={styles.mainContent}>
            <div className={styles.scheduleHeader}>
                <h2 className={styles.mysche}>My schedule</h2>
                <Link to="/eventlist1" className={styles.view}>View all</Link>
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
                {/* =============================================================== */}
                {/* START: แก้ไขส่วนแสดงผล Schedule Card ให้เป็นแบบ Dynamic       (16-11-25)   */}
                {/* =============================================================== */}
                <div className={styles.scheduleListContainer}>
                    {scheduleLoading ? (
                        <div className={styles.scheduleCard}><p>Loading your schedule...</p></div>
                    ) : filteredSchedule.length > 0 ? (
                        // ถ้ามีกิจกรรมในวันที่เลือก ให้ map ข้อมูลมาแสดง
                        filteredSchedule.map(event => (
                            <div className={styles.scheduleCard} key={event.EventID}>
                                <div className={styles.timeBlock}>
                                    {/* ใช้ function formatTime เพื่อแสดงเวลา */}
                                    <span>{formatTime(event.StartDateTime)}</span>
                                    <span>{formatTime(event.EndDateTime)}</span>
                                </div>
                                <div className={styles.scheduleDetails}>
                                    <h3>{event.EventName}</h3>
                                    <p><img src={loci} alt="location icon" /> {event.Location}</p>
                                    
                                    {/* แก้ไขปุ่ม Details ให้เป็น <Link> ที่ชี้ไปหน้ารายละเอียดของ Event นั้นๆ */}
                                    <Link to={`/eventenroll/${event.EventID}`} className={styles.detailsBtn}>
                                        Details
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        // ถ้าไม่มีกิจกรรมในวันที่เลือก ให้แสดงข้อความ
                        <div className={styles.scheduleCard}>
                            <div className={styles.scheduleDetails}>
                                <p>You have no events scheduled for this day.</p>
                            </div>
                        </div>
                    )}
                    {/* =============================================================== */}
                    {/* END: แก้ไขส่วนแสดงผล Schedule Card                               */}
                    {/* =============================================================== */}
                </div>    
            </div>
        </main>
        
        <nav className={styles.bottomNav}>
            <a onClick={() => navigate('/create-event')} className={styles.navItem}>
                <img src={dayi} alt="Create Event" />
                <span>Create Event</span>
            </a>
            <a onClick={() => navigate('/eventlist1')} className={styles.navItem}>
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
                    <div className={styles.profileDetailsContent}>
                        <img src={profile} alt="Profile Picture Large" className={styles.modalProfilePic}/>
                        <p><strong>Name:</strong> <span>{user.name}</span></p>
                        <p><strong>Email:</strong> <span>{user.email}</span></p>
                        <p><strong>Role:</strong> <span>{user.role}</span></p>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
};

export default Dashboard;