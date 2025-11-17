import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './admindashboard.module.css';

// --- Import รูปภาพ ---
import listi from '../assets/images/tab.png';
import settingi from '../assets/images/settings.png';
import logouti from '../assets/images/Log out.png';
import arrowi from '../assets/images/icon.png';
import loci from '../assets/images/location_on.png';
import profile from '../assets/images/profile.webp';

const AdminDashboard = () => {
    // --- States ---
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false); // For Profile Modal
    const [dates, setDates] = useState([]);
    const [activeDate, setActiveDate] = useState(null);
    const [events, setEvents] = useState([]);
    const [dataLoading, setDataLoading] = useState(true);
    const navigate = useNavigate();
    
    // State สำหรับควบคุม Modal รายละเอียด Event
    const [selectedEvent, setSelectedEvent] = useState(null);

    // --- Data Fetching ---
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

    // --- Effects ---
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
                    fetchAllEvents(); // Fetch events after confirming admin role
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

    // --- Helper Functions & Handlers ---
    const openModal = (event) => setSelectedEvent(event);
    const closeModal = () => setSelectedEvent(null);

    const formatTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const getImageUrl = (imagePath) => {
        const serverBaseUrl = import.meta.env.VITE_SERVER_BASE_URL;
        if (!imagePath) return 'https://via.placeholder.com/400x300?text=No+Image';
        return `${serverBaseUrl}/${imagePath}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
        return new Date(dateString).toLocaleDateString('en-GB', options);
    };

    const handleApprove = async (eventId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/events/approve/${eventId}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to approve event');
            alert('Event approved successfully!');
            fetchAllEvents();
            closeModal();
        } catch (err) { console.error(err); alert(err.message); }
    };

    const handleReject = async (eventId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/events/reject/${eventId}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('Failed to reject event');
            alert('Event rejected successfully!');
            fetchAllEvents();
            closeModal();
        } catch (err) { console.error(err); alert(err.message); }
    };

    const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };
    const openProfileModal = () => setIsModalOpen(true);
    const closeProfileModal = () => setIsModalOpen(false);
    const handleDateClick = (date) => setActiveDate(date);
    
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
    
    const adminFilteredSchedule = events
    .filter(event => {
        if (!activeDate || !event.StartDateTime) return false;
        return event.StartDateTime.startsWith(activeDate);
    })
    .sort((a, b) => new Date(a.StartDateTime) - new Date(b.StartDateTime));


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

        <section className={styles.newEventsSection}>
             <div className={styles.eventCardsContainer}>
                {dataLoading && <p style={{ color: 'white', fontSize: '1.2rem' }}>Loading events...</p>}
                {!dataLoading && events.map(event => (
                    <div className={styles.eventCard} key={event.EventID}>
                        <div className={`${styles.statusPill} ${getStatusClass(event.Status)}`}>{event.Status}</div>
                        <img src={getImageUrl(event.ImagePath)} alt={event.EventName} />
                        <div className={styles.eventInfo}>
                            <p className={styles.eventOrganizer}>
                                <span className={`${styles.organizerInitial} ${styles.sInitial}`}>
                                    {event.OrganizerName ? event.OrganizerName.charAt(0).toUpperCase() : 'O'}
                                </span> 
                                {event.OrganizerName || 'Organizer'}
                            </p>
                            <h3>{event.EventName}</h3>
                            <p className={styles.eventDescription}>{event.EventInfo}</p>
                            <button className={styles.detailsBtn} onClick={() => openModal(event)}>Details</button>
                        </div>
                    </div>
                ))}
                <a onClick={() => navigate('/admin/eventlist2')} className={styles.moreCard}>
                    <img src={arrowi} alt="More Events" />
                    <span>More</span>
                </a>
            </div>
        </section>

        <main className={styles.mainContent}>
            <div className={styles.scheduleHeader}>
                <h2 className={styles.mysche}>Event schedule</h2>
                <Link to="/admin/eventlist2" className={styles.view}>View all</Link>
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
                
                <div className={styles.scheduleListContainer}>
                    {dataLoading ? (
                        <div className={styles.scheduleCard}><p>Loading schedule...</p></div>
                    ) : adminFilteredSchedule.length > 0 ? (
                        adminFilteredSchedule.map(event => (
                            <div className={styles.scheduleCard} key={event.EventID}>
                                <div className={styles.timeBlock}>
                                    <span>{formatTime(event.StartDateTime)}</span>
                                    <span>{formatTime(event.EndDateTime)}</span>
                                </div>
                                <div className={styles.scheduleDetails}>
                                    <h3>{event.EventName}</h3>
                                    <p><img src={loci} alt="location icon" /> {event.Location}</p>
                                    <button 
                                        className={styles.detailsBtn}
                                        onClick={() => openModal(event)}
                                    >
                                        Details
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.scheduleCard}>
                            <div className={styles.scheduleDetails}>
                               <p>No events scheduled for this day.</p>
                            </div>
                        </div>
                    )}
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

        {/* --- Modal แสดงรายละเอียด Event --- */}
        {selectedEvent && (
            <div className={styles.modalOverlay} onClick={closeModal}>
                <div className={styles.modalContentDetail} onClick={(e) => e.stopPropagation()}>
                    <span className={styles.closeBtn} onClick={closeModal}>&times;</span>
                    
                    <div className={styles.detailHeader}>
                        <h2>Event Detail</h2>
                    </div>

                    <div className={styles.textContent}>
                        <div className={styles.headerBandDetail}>
                            <h3 className={styles.detailHeaderText}>Title</h3>
                        </div>
                        <p>{selectedEvent.EventName}</p>

                        <div className={styles.headerBandDetail}>
                            <h3 className={styles.detailHeaderText}>Detail</h3>
                        </div>
                        <p style={{whiteSpace: 'pre-wrap'}}>{selectedEvent.EventInfo || 'No description provided.'}</p>
                            <p><strong>Date:</strong> {formatDate(selectedEvent.StartDateTime)} - {formatDate(selectedEvent.EndDateTime)}</p>
                            <p><strong>Location:</strong> {selectedEvent.Location}</p>
                            <p><strong>Participants:</strong> {selectedEvent.MaxParticipant || 'Unlimited'}</p>
                            <p><strong>Staff:</strong> {selectedEvent.MaxStaff || 'N/A'}</p>
                        
                        <div className={styles.headerBandDetail}>
                            <h3 className={styles.detailHeaderText}>Organizer</h3>
                        </div>
                        <p>{selectedEvent.OrganizerName || 'N/A'}</p>
                    </div>

                    <div className={styles.imageSidebar}>
                        <img src={getImageUrl(selectedEvent.ImagePath)} alt={selectedEvent.EventName} />
                        
                        {selectedEvent.Status === 'Approved' && (
                            <div className={styles.approvedStatusBox}><i className="fas fa-check-circle"></i> Approved</div>
                        )}
                        {selectedEvent.Status === 'Rejected' && (
                            <div className={styles.rejectedStatusBox}><i className="fas fa-times-circle"></i> Rejected</div>
                        )}
                        {selectedEvent.Status === 'Pending' && (
                            <div className={styles.pendingStatusBox}><i className="fas fa-hourglass-half"></i> Pending</div>
                        )}

                        {selectedEvent.Status === 'Pending' && (
                            <div className={styles.modalActions}>
                                <button onClick={() => handleApprove(selectedEvent.EventID)} className={styles.modalApproveBtn}>Approve</button>
                                <button onClick={() => handleReject(selectedEvent.EventID)} className={styles.modalRejectBtn}>Reject</button>
                            </div>
                        )}
                    </div>
                    
                    {selectedEvent.Status === 'Rejected' && (
                        <div className={styles.reasonRejectionSection}>
                            <div className={styles.headerBandDetail}>
                                <h3 className={styles.detailHeaderText}>Reason for rejection</h3>
                            </div>
                            <p>Non-compliance with university policies or regulations. (Default Reason)</p>
                        </div>
                    )}
                    
                    <button className={styles.backBtn} onClick={closeModal}>Back</button>
                </div>
            </div>
        )}

      </div>
    );
};

export default AdminDashboard;