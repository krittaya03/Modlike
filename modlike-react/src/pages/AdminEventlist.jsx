// src/pages/AdminEventlist.jsx (ฉบับสมบูรณ์พร้อม Modal)

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminEventlist.module.css';
import Adside from '../components/Adside';
import filteri from '../assets/images/Filter.png';
import loci from '../assets/images/location_on.png';
import clocki from '../assets/images/Clock.png';

const baseURL = 'http://localhost:3000';

const AdminEventlist = () => {
    const [activeTab, setActiveTab] = useState('event-list');
    const navigate = useNavigate();

    // State สำหรับ Modal
    const [selectedEvent, setSelectedEvent] = useState(null); // เก็บ object ของ event ที่ถูกเลือก

    // State สำหรับเก็บข้อมูลที่ได้จาก API
    const [allEvents, setAllEvents] = useState([]);
    const [pendingEvents, setPendingEvents] = useState([]);
    const [approvedEvents, setApprovedEvents] = useState([]);
    const [rejectedEvents, setRejectedEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ฟังก์ชันสำหรับดึงข้อมูลทั้งหมด
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const headers = { 'Authorization': `Bearer ${token}` };

            const [allRes, pendingRes, approvedRes, rejectedRes] = await Promise.all([
                fetch(`${baseURL}/api/events/admin/all`, { headers }),
                fetch(`${baseURL}/api/events/pending`, { headers }),
                fetch(`${baseURL}/api/events/admin/all?status=Approved`, { headers }),
                fetch(`${baseURL}/api/events/admin/all?status=Rejected`, { headers }),
            ]);

            if (!allRes.ok || !pendingRes.ok || !approvedRes.ok || !rejectedRes.ok) {
                throw new Error('Failed to fetch data');
            }
            
            const allData = await allRes.json();
            const pendingData = await pendingRes.json();
            const approvedData = await approvedRes.json();
            const rejectedData = await rejectedRes.json();

            console.log("All Events Data from API:", allData);

            setAllEvents(allData);
            setPendingEvents(pendingData);
            setApprovedEvents(approvedData);
            setRejectedEvents(rejectedData);

        } catch (err) {
            console.error('Error fetching events:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ฟังก์ชันสำหรับจัดการ Approve/Reject
    const handleApprove = async (eventId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${baseURL}/api/events/approve/${eventId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to approve event');
            alert('Event approved successfully!');
            fetchData();
            closeModal(); // ปิด Modal ถ้าเปิดอยู่
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    const handleReject = async (eventId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${baseURL}/api/events/reject/${eventId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to reject event');
            alert('Event rejected successfully!');
            fetchData();
            closeModal(); // ปิด Modal ถ้าเปิดอยู่
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    };

    // ฟังก์ชัน Helper สำหรับจัดรูปแบบวันที่และเวลา
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { 
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false 
        };
        return new Date(dateString).toLocaleDateString('en-GB', options);
    };

    // ฟังก์ชันจัดการ Modal
    const openModal = (event) => {
        setSelectedEvent(event);
    };

    const closeModal = () => {
        setSelectedEvent(null);
    };

    // ฟังก์ชันจัดการอื่นๆ
    const handleTabClick = (tabId) => setActiveTab(tabId);
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Helper สำหรับแปลง path รูปภาพ (รองรับทั้งแบบมี/ไม่มี uploads/)
    const getImageUrl = (imagePath) => {
        if (!imagePath) return 'https://via.placeholder.com/400x300?text=No+Image';
        // ถ้า path มีคำว่า uploads อยู่แล้ว ไม่ต้องเติมซ้ำ หรือถ้าเป็น full URL ก็ใช้ได้เลย
        if (imagePath.startsWith('http') || imagePath.startsWith('uploads/')) {
             return `${baseURL}/${imagePath}`;
        }
        // กรณีปกติที่เก็บแค่ชื่อไฟล์ หรือ path ย่อย
        return `${baseURL}/${imagePath}`;
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className={styles['app-container']}>
            <Adside handleLogout={handleLogout} />

            <div className={styles['main-content-adlist']}>
                <header className={styles.Admineventlist}>
                    <div className={styles['tab-navigation']}>
                        <button className={`${styles['tab-btn']} ${activeTab === 'event-list' ? styles.active : ''}`} onClick={() => handleTabClick('event-list')}>Event List</button>
                        <button className={`${styles['tab-btn']} ${activeTab === 'approval-queue' ? styles.active : ''}`} onClick={() => handleTabClick('approval-queue')}>Approval Queue</button>
                        <button className={`${styles['tab-btn']} ${activeTab === 'approve' ? styles.active : ''}`} onClick={() => handleTabClick('approve')}>Approved</button>
                        <button className={`${styles['tab-btn']} ${activeTab === 'reject' ? styles.active : ''}`} onClick={() => handleTabClick('reject')}>Rejected</button>
                    </div>
                </header>

                {/* ========================================================= */}
                {/* กล่องสีขาว Wrapper */}
                {/* ========================================================= */}
                <div className={styles['tab-content-container']}>

                    {/* Event List Tab Content */}
                    <div id="event-list" className={`${styles['tab-content']} ${activeTab === 'event-list' ? styles.active : ''}`}>
                        <div className={styles['filter-tag']}>
                            <span><img src={filteri} alt="Filter" />Filter</span>
                        </div>
                        <div className={styles.listcontain}>
                            {allEvents.length > 0 ? allEvents.map(event => {

                                // =================================================================
                                // === วาง CONSOLE.LOG ไว้ตรงนี้!!! (ข้างใน .map แต่ก่อน return) ===
                                // =================================================================
                                console.log(`[Event List Tab] Rendering Event ID: ${event.EventID}, ImagePath: ${event.ImagePath}`);

                                return (
                                    <div key={event.EventID} className={styles['event-cardlist1']}>
                                        <div className={styles['event-image-container']}>
                                            <img src={getImageUrl(event.ImagePath)} alt={event.EventName} />
                                        </div>
                                        <div className={styles['event-detailslist1']}>
                                            <h3 className={styles['event-title']}>{event.EventName}</h3>
                                            <div className={styles['event-info-row']}>
                                                <img src={clocki} alt="Time" />
                                                <span>{formatDate(event.StartDateTime)} - {formatDate(event.EndDateTime)}</span>
                                            </div>
                                            <div className={`${styles['event-info-row']} ${styles['location-row']}`}>
                                                <img src={loci} alt="Location" className={styles.loci} />
                                                <div className={styles['location-text']}>
                                                    <span>{event.Location}</span>
                                                </div>
                                            </div>
                                            <button className={styles['details-btnlist1']} onClick={() => openModal(event)}>Details</button>
                                        </div>
                                    </div>
                                );
                            }) : <p>No events found.</p>}
                        </div>
                    </div>

                    {/* Approval Queue Tab Content */}
                    <div id="approval-queue" className={`${styles['tab-content']} ${activeTab === 'approval-queue' ? styles.active : ''}`}>
                        <div className={styles['filter-tabs-approval']}>
                            <div className={`${styles['filter-tab-item']} ${styles.active}`}><i className="fas fa-check"></i> Processing</div>
                            <div className={styles['filter-tab-item']}>All</div>
                        </div>
                        {pendingEvents.length > 0 ? pendingEvents.map(event => (
                            <div key={event.EventID} className={styles['approval-item']}>
                                <img src={getImageUrl(event.ImagePath)} alt={event.EventName} className={styles['approval-image']} />
                                <div className={styles['approval-details']}>
                                    <h3 className={styles['title-text']}>{event.EventName}</h3>
                                    <div className={styles['info-line']}><i className="far fa-clock"></i> <img src={clocki} alt="Time" className={styles.clocki}/>{formatDate(event.StartDateTime)}</div>
                                    <div className={styles['info-line']}><i className="fas fa-map-marker-alt"></i><img src={loci} alt="Location" className={styles.loci} /> {event.Location}</div>
                                    {/* เชื่อมปุ่ม Details กับ openModal */}
                                    <button className={`${styles['details-btn']} ${styles['details-queue-btn']} ${styles['details-top-right']}`} onClick={() => openModal(event)}>Details</button>
                                </div>
                                <div className={styles['horizontal-actions']}>
                                    <button className={`${styles['action-btn']} ${styles['approve-btn']}`} onClick={() => handleApprove(event.EventID)}>Approve</button>
                                    <button className={`${styles['action-btn']} ${styles['reject-btn']}`} onClick={() => handleReject(event.EventID)}>Reject</button>
                                </div>
                            </div>
                        )) : <p>No events awaiting approval.</p>}
                    </div>

                    {/* Approve Tab Content */}
                    <div id="approve" className={`${styles['tab-content']} ${activeTab === 'approve' ? styles.active : ''}`}>
                        {approvedEvents.length > 0 ? approvedEvents.map(event => (
                            <div key={event.EventID} className={styles['approved-item']}>
                                <img src={getImageUrl(event.ImagePath)} alt={event.EventName} className={styles['approved-image']} />
                                <div className={styles['approved-details']}>
                                    <h3 className={styles['title-text']}>{event.EventName}</h3>
                                    <div className={styles['info-line']}><i className="far fa-clock"></i><img src={clocki} alt="Time" className={styles.clocki}/> {formatDate(event.StartDateTime)} - {formatDate(event.EndDateTime)}</div>
                                    <div className={styles['info-line']}><i className="fas fa-map-marker-alt"></i><img src={loci} alt="Location" className={styles.loci} /> {event.Location}</div>
                                </div>
                                <span className={`${styles['status-tag']} ${styles['status-approved']}`}>Status: Approved</span>
                                {/* เชื่อมปุ่ม Details กับ openModal */}
                                <button className={styles['details-btn']} onClick={() => openModal(event)}>Details</button>
                            </div>
                        )) : <p>No approved events.</p>}
                    </div>

                    {/* Reject Tab Content */}
                    <div id="reject" className={`${styles['tab-content']} ${activeTab === 'reject' ? styles.active : ''}`}>
                        {rejectedEvents.length > 0 ? rejectedEvents.map(event => (
                            <div key={event.EventID} className={styles['rejected-item']}>
                                <img src={getImageUrl(event.ImagePath)} alt={event.EventName} className={styles['rejected-image']} />
                                <div className={styles['rejected-details']}>
                                    <h3 className={styles['title-text']}>{event.EventName}</h3>
                                    <div className={styles['info-line']}><i className="far fa-clock"></i><img src={clocki} alt="Time" className={styles.clocki}/> {formatDate(event.StartDateTime)} - {formatDate(event.EndDateTime)}</div>
                                    <div className={styles['info-line']}><i className="fas fa-map-marker-alt"></i><img src={loci} alt="Location" className={styles.loci} /> {event.Location}</div>
                                </div>
                                <span className={`${styles['status-tag']} ${styles['status-rejected']}`}>Status: Rejected</span>
                                {/* เชื่อมปุ่ม Details กับ openModal */}
                                <button className={styles['details-btn']} onClick={() => openModal(event)}>Details</button>
                            </div>
                        )) : <p>No rejected events.</p>}
                    </div>
                </div>
            </div>

            {/* ========================================================= */}
            {/* Modal Component (Dynamic) */}
            {/* ========================================================= */}
            {selectedEvent && (
                <div className={styles.modal} onClick={closeModal} style={{display: 'flex'}}> {/* บังคับให้แสดงผลเมื่อมี selectedEvent */}
                    <div className={`${styles['modal-content']} ${styles['detail-page']}`} onClick={(e) => e.stopPropagation()}>
                        <span className={styles['close-btn']} onClick={closeModal}>&times;</span>
                        
                        <div className={styles['detail-header']}>
                            <h2>Event Detail</h2>
                        </div>

                        <div className={styles['image-sidebar']}>
                            <img src={getImageUrl(selectedEvent.ImagePath)} alt={selectedEvent.EventName} />
                            
                            {/* Status Badge */}
                            {selectedEvent.Status === 'Approved' && (
                                <div className={styles['approved-status-box']}><i className="fas fa-check-circle"></i> Approved</div>
                            )}
                            {selectedEvent.Status === 'Rejected' && (
                                <div className={styles['rejected-status-box']}><i className="fas fa-times-circle"></i> Rejected</div>
                            )}
                            {selectedEvent.Status === 'Pending' && (
                                <div className={styles['pending-status-box']} style={{backgroundColor: '#f39c12', color: 'white', padding: '10px 20px', borderRadius: '50px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                                    <i className="fas fa-hourglass-half"></i> Pending
                                </div>
                            )}

                            {/* Action Buttons for Pending Event in Modal */}
                            {selectedEvent.Status === 'Pending' && (
                                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', width: '100%' }}>
                                    <button 
                                        onClick={() => handleApprove(selectedEvent.EventID)}
                                        style={{ flex: 1, padding: '10px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Approve
                                    </button>
                                    <button 
                                        onClick={() => handleReject(selectedEvent.EventID)}
                                        style={{ flex: 1, padding: '10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className={styles['text-content']}>
                            <div className={styles['header-band-detail']}>
                                <h3 className={styles['detail-header-text']}>Title</h3>
                            </div>
                            <p>{selectedEvent.EventName}</p>

                            <div className={styles['header-band-detail']}>
                                <h3 className={styles['detail-header-text']}>Detail</h3>
                            </div>
                            <p style={{whiteSpace: 'pre-wrap'}}>{selectedEvent.EventInfo || 'No description provided.'}</p>
                            <p><strong>Date:</strong> {formatDate(selectedEvent.StartDateTime)} - {formatDate(selectedEvent.EndDateTime)}</p>
                            <p><strong>Location:</strong> {selectedEvent.Location}</p>
                            <p><strong>Participants:</strong> {selectedEvent.MaxParticipant || 'Unlimited'}</p>
                            <p><strong>Staff:</strong> {selectedEvent.MaxStaff || 'N/A'}</p>

                            <div className={styles['header-band-detail']}>
                                <h3 className={styles['detail-header-text']}>Organizer</h3>
                            </div>
                            <p>{selectedEvent.OrganizerName || 'N/A'} (ID: {selectedEvent.EventOrgID})</p>
                        </div>

                        {selectedEvent.Status === 'Rejected' && (
                            <div className={styles['reason-rejection-section']} style={{ gridArea: 'reason' }}>
                                <div className={styles['header-band-detail']}>
                                    <h3 className={styles['detail-header-text']}>Reason for rejection</h3>
                                </div>
                                {/* ในอนาคตถ้ามี field 'RejectReason' ใน DB ก็นำมาแสดงตรงนี้ */}
                                <p>Non-compliance with university policies or regulations. (Default Reason)</p>
                            </div>
                        )}
                        
                        <button className={styles['back-btn']} onClick={closeModal} style={{ gridArea: 'back-btn', justifySelf: 'center', marginTop: '20px', padding: '10px 30px', backgroundColor: '#162660', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                            Back
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminEventlist;