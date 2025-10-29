// src/pages/EventListPage1.jsx (ฉบับแก้ไขที่ถูกต้อง)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import styles from './eventlistuser.module.css';

import loci from '../assets/images/location_on.png';
import clocki from '../assets/images/Clock.png';
import filteri from '../assets/images/Filter.png';

const EventListPage1 = () => {
    const [activeTab, setActiveTab] = useState('eventList');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            setError(null);
            setEvents([]);

            // <-- FIX 1: ใช้ตัวแปรจาก .env มาสร้าง URL ของ API
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
            const endpointPath = activeTab === 'eventList' ? '/events/approved' : '/events/my-events'; // <-- สมมติว่ามี endpoint นี้
            const endpoint = `${apiBaseUrl}${endpointPath}`;

            try {
                // <-- FIX 2: ใช้ 'token' ให้ตรงกับที่อื่น
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setEvents(data);

            } catch (err) {
                console.error(`Failed to fetch ${activeTab}:`, err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [activeTab, navigate]);

    const handleLogout = () => {
        // <-- FIX 2: ใช้ 'token' ให้ตรงกับที่อื่น
        localStorage.removeItem('token');
        navigate('/login');
    };

    const formatDateTime = (start, end) => {
        const startDate = new Date(start).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' });
        const endDate = new Date(end).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' });

        if (startDate === endDate) {
            const startTime = new Date(start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            const endTime = new Date(end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            return `${startDate} ${startTime} - ${endTime}`;
        }

        return `${startDate} - ${endDate}`;
    };

    // <-- FIX 3: ดึงค่า Server Base URL มาใช้กับรูปภาพ
    const serverBaseUrl = import.meta.env.VITE_SERVER_BASE_URL;

    return (
        <div className={styles.eventlistpage}>
            <main className={styles['main-content-area']}>
                <div className={styles['tab-top']}>
                    <button
                        className={`${styles['tab-item']} ${activeTab === 'eventList' ? styles.active : ''}`}
                        onClick={() => setActiveTab('eventList')}
                    >
                        Event List
                    </button>
                    <button
                        className={`${styles['tab-item']} ${activeTab === 'myEvent' ? styles.active : ''}`}
                        onClick={() => setActiveTab('myEvent')}
                    >
                        My Event
                    </button>
                </div>

                <div className={styles['tab-content-container']}>
                    <div className={styles.filter}>
                        <span><img src={filteri} alt="Filter" />Filter</span>
                    </div>

                    <div className={styles.listcontain}>
                        {loading && <p>Loading events...</p>}
                        {error && <p className={styles['error-message']}>Error: {error}</p>}

                        {!loading && !error && events.map(event => (
                            <div key={event.EventID} className={styles['event-cardlist1']}>
                                <div className={styles['event-image-container']}>
                                     {/* <-- FIX 3: ใช้ตัวแปรกับ URL ของรูปภาพ --> */}
                                    <img src={`${serverBaseUrl}/${event.ImagePath}`} alt={event.EventName} />
                                </div>
                                <div className={styles['event-detailslist1']}>
                                    <h3 className={styles['event-title']}>{event.EventName}</h3>
                                    <div className={styles['event-info-row']}>
                                        <img src={clocki} alt="Time" />
                                        <span>{formatDateTime(event.StartDateTime, event.EndDateTime)}</span>
                                    </div>
                                    <div className={`${styles['event-info-row']} ${styles['location-row']}`}>
                                        <img src={loci} alt="Location" className={styles.loci} />
                                        <div className={styles['location-text']}>
                                            <span>{event.Location}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/events/${event.EventID}`)}
                                        className={styles['details-btnlist1']}
                                    >
                                        Details
                                    </button>
                                </div>
                            </div>
                        ))}

                        {!loading && !error && events.length === 0 && (
                            <p>No events found.</p>
                        )}
                    </div>
                </div>
            </main>

            <Sidebar handleLogout={handleLogout} />
        </div>
    );
}

export default EventListPage1;