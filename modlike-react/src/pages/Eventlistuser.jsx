// src/pages/Eventlistuser.jsx (ฉบับแก้ไข)
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import styles from "./eventlistuser.module.css";

import loci from "../assets/images/location_on.png";
import clocki from "../assets/images/Clock.png";
import filteri from "../assets/images/Filter.png";

const EventListPage1 = () => {
  const [activeTab, setActiveTab] = useState("eventList"); // eventList | myEvent
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const serverBaseUrl = import.meta.env.VITE_SERVER_BASE_URL;

  const formatDateTime = (start, end) => {
    const sd = new Date(start);
    const ed = new Date(end);
    const sameDay = sd.toLocaleDateString() === ed.toLocaleDateString();
    const d = sd.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "2-digit" });
    const d2 = ed.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "2-digit" });
    const t1 = sd.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    const t2 = ed.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    return sameDay ? `${d} ${t1} - ${t2}` : `${d} - ${d2}`;
  };

  // ✅ helper: แสดงป้ายสถานะ (Pending => Processing)
  const renderStatusBadge = (status) => {
    if (!status) return null;
    const label = status === "Pending" ? "Processing" : status;
    const colorMap = {
      Processing: "#f7c5a6",
      Draft: "#e1e8ff",
      Approved: "#c8f7e1",
      Rejected: "#ffd9df",
      Cancelled: "#f0f0f0",
    };
    const pillStyle = {
      position: "absolute",
      top: 10,
      right: 12,
      padding: "6px 10px",
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      background: colorMap[label] || "#eee",
      color: "#333",
      boxShadow: "0 2px 6px rgba(0,0,0,.08)",
    };
    return <span style={pillStyle}>Status: {label}</span>;
  };

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setEvents([]);

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const endpoint =
        activeTab === "eventList"
          ? `${apiBaseUrl}/events/approved`
          : `${apiBaseUrl}/events/status`; // server คืน { events: [...] }

      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.events || [];
      setEvents(list);
    } catch (err) {
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [activeTab, apiBaseUrl, navigate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleCancel = async (eventId) => {
    if (!confirm("Cancel this event?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBaseUrl}/events/cancel/${eventId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.message || `HTTP ${res.status}`);
      }
      await fetchEvents();
      alert("Cancelled.");
    } catch (err) {
      alert(`Cancel failed: ${err.message}`);
    }
  };

  // ✅ [STEP 1] แก้ไข handleEdit ให้รับ status และเปลี่ยนเส้นทางสำหรับ Draft
  const handleEdit = (eventId, status) => {
    if (status === "Draft") {
      // ถ้าเป็น Draft ให้ไปที่หน้า create พร้อมส่ง ID ไปเป็น query string
      navigate(`/create-event?editId=${eventId}`);
    } else {
      // สถานะอื่นๆ (เช่น Pending, Rejected) ไปที่หน้า edit แบบเดิม
      navigate(`/events/edit/${eventId}`);
    }
  };

  return (
    <div className={styles.eventlistpage}>
      <main className={styles["main-content-area"]}>
        <div className={styles["tab-top"]}>
          <button
            className={`${styles["tab-item"]} ${activeTab === "eventList" ? styles.active : ""}`}
            onClick={() => setActiveTab("eventList")}
          >
            Event List
          </button>
          <button
            className={`${styles["tab-item"]} ${activeTab === "myEvent" ? styles.active : ""}`}
            onClick={() => setActiveTab("myEvent")}
          >
            My Event
          </button>
        </div>

        <div className={styles["tab-content-container"]}>
          <div className={styles.filter}>
            <span>
              <img src={filteri} alt="Filter" />
              Filter
            </span>
          </div>

          <div className={styles.listcontain}>
            {loading && <p>Loading events...</p>}
            {error && <p className={styles["error-message"]}>Error: {error}</p>}

            {!loading &&
              !error &&
              events.map((event) => {
                const status = event.Status; // ใช้ชื่อฟิลด์จาก BE
                return (
                  <div
                    key={event.EventID}
                    className={styles["event-cardlist1"]}
                    style={{ position: "relative" }} // เพื่อวาง badge มุมขวาบน
                  >
                    {/* Badge สถานะ: แสดงเฉพาะแท็บ My Event */}
                    {activeTab === "myEvent" && renderStatusBadge(status)}

                    {/* แสตมป์ยกเลิก (มีอยู่เดิม) */}
                    {activeTab === "myEvent" && status === "Cancelled" && (
                      <div className={styles["cancelled-stamp"]}>CANCELLED</div>
                    )}

                    <div className={styles["event-image-container"]}>
                      <img
                        src={
                          event.ImagePath
                            ? `${serverBaseUrl}/${event.ImagePath}`
                            : `${serverBaseUrl}/uploads/placeholder.jpg`
                        }
                        alt={event.EventName}
                      />
                    </div>

                    <div className={styles["event-detailslist1"]}>
                      <h3 className={styles["event-title"]}>{event.EventName}</h3>

                      <div className={styles["event-info-row"]}>
                        <img src={clocki} alt="Time" />
                        <span>{formatDateTime(event.StartDateTime, event.EndDateTime)}</span>
                      </div>

                      <div className={`${styles["event-info-row"]} ${styles["location-row"]}`}>
                        <img src={loci} alt="Location" className={styles.loci} />
                        <div className={styles["location-text"]}>
                          <span>{event.Location}</span>
                        </div>
                      </div>

                      {activeTab === "myEvent" ? (
                        <div className={styles["management-buttons"]}>
                          {/* ✅ [STEP 2] ส่ง status เข้าไปใน onClick ของปุ่ม Edit */}
                          {status === "Draft" && (
                            <>
                              <button
                                onClick={() => handleEdit(event.EventID, status)}
                                className={`${styles["action-btn"]} ${styles["fix-btn"]}`}
                              >
                                Edit
                              </button>
                              <button
                                  onClick={() => handleCancel(event.EventID)}
                                  className={`${styles["action-btn"]} ${styles["cancel-btn"]}`}
                              >
                                  Cancel
                              </button>
                            </>
                          )}

                          {status === "Pending" && (
                            <>
                              <button
                                onClick={() => handleEdit(event.EventID)}
                                className={`${styles["action-btn"]} ${styles["fix-btn"]}`}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleCancel(event.EventID)}
                                className={`${styles["action-btn"]} ${styles["cancel-btn"]}`}
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {/* {status === "Rejected" && (
                            <button
                              onClick={() => handleEdit(event.EventID)}
                              className={`${styles["action-btn"]} ${styles["fix-btn"]}`}
                            >
                              Edit
                            </button>
                          )} */}

                          {(status === "Approved" || status === "Cancelled") && (
                            <button
                              onClick={() => navigate(`/events/${event.EventID}`)}
                              className={styles["details-btnlist1"]}
                            >
                              Details
                            </button>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => navigate(`/events/${event.EventID}`)}
                          className={styles["details-btnlist1"]}
                        >
                          Details
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

            {!loading && !error && events.length === 0 && <p>No events found.</p>}
          </div>
        </div>
      </main>

      <Sidebar handleLogout={handleLogout} />
    </div>
  );
};

export default EventListPage1;
