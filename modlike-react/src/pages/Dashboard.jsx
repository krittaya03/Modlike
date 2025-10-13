// src/pages/Dashboard.jsx (ฉบับสมบูรณ์)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard.css';

// --- Import รูปภาพ (กรุณาตรวจสอบ Path ให้ถูกต้อง) ---
import dayi from '../assets/images/today.png';
import listi from '../assets/images/tab.png';
import settingi from '../assets/images/settings.png';
import logouti from '../assets/images/Log out.png';
import arrowi from '../assets/images/icon.png';
import loci from '../assets/images/location_on.png';
import profile from '../assets/images/profile.webp';

const Dashboard = () => {
    // --- ส่วน Logic ทั้งหมด ---
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [dates, setDates] = useState([]);
    const [activeDate, setActiveDate] = useState(null);
    const navigate = useNavigate();

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
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/me`, {
                    headers: { 'Authorization': `Bearer ${effectiveToken}` },
                });
                if (!response.ok) throw new Error('Invalid token');
                const data = await response.json();
                setUser(data.user);
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

    if (loading) return <div className="loading-container">Loading...</div>;
    if (!user) return <div className="loading-container">Could not load user data. Redirecting...</div>;

    return (
      <div className="dashboard-container">
        
        <header className="blueblock">
            <h1 className="welcome-title">Welcome, {user.name}</h1>
            <hr id="line" />
            <h3 id="newevent">New event</h3>
            
            <div id="profile-icon-btn" className="profile-icon" onClick={openProfileModal}>
                <img src={profile} alt="Profile Icon" />
            </div>
        </header>

        <section className="new-events-section">
            <div className="event-cards-container">
                 <div className="event-card">
                    <img src="https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?w=500" alt="Singing Contest" />
                    <div className="event-info">
                        <p className="event-organizer"><span className="organizer-initial s-initial">S</span> School of Liberal Arts, KMUTT</p>
                        <h3>ENGLISH Singing Contest 2025</h3>
                        <p className="event-description">เวทีที่ทุกคนจะได้แสดงความสามารถและปลดปล่อยความเป็นศิลปิน</p>
                        <button className="details-btn">Details</button>
                    </div>
                </div>
                <div className="event-card">
                    <img src="https://nihongoaz.com/wp-content/uploads/2023/11/a-brief-introduction-to-japanese-660x330.jpg" alt="Japanese Friend" />
                    <div className="event-info">
                        <p className="event-organizer"><span className="organizer-initial g-initial">G</span> GCDC Play</p>
                        <h3>Chit Chatting with a Japanese Friend</h3>
                        <p className="event-description">พูดคุย แลกเปลี่ยนวัฒนธรรม สร้างมิตรภาพไทย-ญี่ปุ่น</p>
                        <button className="details-btn">Details</button>
                    </div>
                </div>
                <div className="event-card">
                    <img src="https://th.bing.com/th/id/R.cf30308b156264ce4bb34ce82357932a?rik=MB5ay0r0geAM2g&riu=http%3a%2f%2fwww.superadrianme.com%2fwp-content%2fuploads%2f2013%2f08%2fshutterstock_126738602-Travel.jpg&ehk=rYaCc0oYEnZNvtBFkMLOxcs%2fHf2qsk9Ra%2b3tvgARIVg%3d&risl=1&pid=ImgRaw&r=0" alt="Travel"/>
                    <div className="event-info">
                        <p className="event-organizer"><span className="organizer-initial g-initial">G</span> GCDC Play</p>
                        <h3>Play, Think, & Travel!</h3>
                        <p className="event-description">เรียนรู้เรื่องวัฒนธรรมและปรัชญาชีวิตจากการท่องเที่ยว</p>
                        <button className="details-btn">Details</button>
                    </div>
                </div>
                <div className="event-card">
                    <img src="https://cbassociatetraining.co.uk/wp-content/uploads/2019/06/cbat-post-communication-featured.jpg" alt="Chat Heaven"/>
                    <div className="event-info">
                        <p className="event-organizer"><span className="organizer-initial g-initial">G</span> GCDC Play</p>
                        <h3>Chat Heaven</h3>
                        <p className="event-description">ฝึกฝนทักษะด้านการสนทนาและการแสดงออกในสถานการณ์จำลอง</p>
                        <button className="details-btn">Details</button>
                    </div>
                </div>
                <a href="#" className="more-card">
                    <img src={arrowi} alt="More Events" />
                    <span>More</span>
                </a>
            </div>
        </section>

        <main className="main-content">
            <div className="schedule-header">
                <h2 id="mysche">My schedule</h2>
                <h2 id="view">View all</h2>
            </div>

            <div className="schedule-layout">
                <div className="date-tabs">
                    {dates.map((date) => (
                        <div key={date.fullDate} className={`date-tab ${activeDate === date.fullDate ? 'active' : ''}`} onClick={() => handleDateClick(date.fullDate)}>
                            <span className="day-name">{date.dayName}</span>
                            <span className="day-number">{date.dayNumber}</span>
                        </div>
                    ))}
                </div>
                <div className="schedule-card">
                    <div className="time-block">
                        <span>08.30</span>
                        <span>12.30</span>
                    </div>
                    <div className="schedule-details">
                        <h3>Sustainability Expo 2025</h3>
                        <p><img src={loci} alt="location icon" /> N16 Learning Exchance Building Floor: 1st floor</p>
                        <button className="details-btn">Details</button>
                    </div>
                </div>
            </div>
        </main>
        
        <nav className="bottom-nav">
            <a href="#" className="nav-item">
                <img src={dayi} alt="Create Event" />
                <span>Create Event</span>
            </a>
            <a href="#" className="nav-item">
                <img src={listi} alt="Event List" />
                <span>Event List</span>
            </a>
            <a href="#" className="nav-item">
                <img src={settingi} alt="Settings" />
                <span>Setting</span>
            </a>
            <a href="#" onClick={handleLogout} className="nav-item">
                <img src={logouti} alt="Log out" />
                <span>Log out</span>
            </a>
        </nav>

        {isModalOpen && (
            <div className="modal-overlay" onClick={closeProfileModal}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <button className="modal-close-button" onClick={closeProfileModal}>&times;</button>
                    <h2>My Profile</h2>
                    <div className="profile-details-content">
                        <img src={profile} alt="Profile Picture Large" className="modal-profile-pic"/>
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