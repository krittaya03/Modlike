import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./EditEventPage.module.css";

export default function EditEventPage() {
  const { id } = useParams();
  const nav = useNavigate();

  // แปลงเวลา DB <-> input(datetime-local)
  const toInput = (s) => (s ? s.replace(" ", "T").slice(0, 16) : "");
  const toMySQL = (s) => (s ? s.replace("T", " ") + ":00" : null);

  const [form, setForm] = useState({
    EventName: "",
    EventInfo: "",
    StartDateTime: "",
    EndDateTime: "",
    Location: "",
    MaxParticipant: 0,
    MaxStaff: 0,
    ImagePath: "",
  });

  const api = import.meta.env.VITE_API_BASE_URL;
  const fileBase = import.meta.env.VITE_SERVER_BASE_URL || "";
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${api}/events/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch event");
        const data = await res.json();
        setForm({
          ...data,
          StartDateTime: toInput(data.StartDateTime),
          EndDateTime: toInput(data.EndDateTime),
        });
      } catch (e) {
        console.error(e);
        alert("Error loading event data");
      }
    };
    fetchData();
  }, [api, id, token]);

  const onChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
  };

  const onResubmit = async () => {
    try {
      const res = await fetch(`${api}/events/resubmit/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.EventName,
          eventInfo: form.EventInfo,
          location: form.Location,
          startDateTime: toMySQL(form.StartDateTime),
          endDateTime: toMySQL(form.EndDateTime),
          maxParticipant: form.MaxParticipant,
          maxStaff: form.MaxStaff,
        }),
      });
      if (!res.ok) throw new Error("resubmit failed");
      alert("✅ The event has been edited and resubmitted!");
      nav("/eventlist1");
    } catch (e) {
      console.error(e);
      alert("❌ Failed to resubmit event");
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.header}>Edit Event Info.</h1>

      <div className={styles.grid}>
        {/* LEFT column */}
        <div className={styles.left}>
          <div className={styles.sectionTitle}>Title</div>
          <div className={styles.formGroup}>
            <input
              className={styles.input}
              name="EventName"
              value={form.EventName}
              onChange={onChange}
              placeholder="Event title"
            />
          </div>

          <div className={styles.sectionTitle}>Description</div>
          <div className={styles.formGroup}>
            <textarea
              className={styles.textarea}
              name="EventInfo"
              value={form.EventInfo}
              onChange={onChange}
              placeholder="Describe your event..."
            />
          </div>

          {/* แถวเวลา: แต่ละคอลัมน์มีหัวข้อของตัวเอง */}
          <div className={styles.twoCol}>
            <div>
              <div className={styles.sectionTitle}>Start Time</div>
              <div className={styles.inputBox}>
                <input
                  className={styles.input}
                  type="datetime-local"
                  name="StartDateTime"
                  value={form.StartDateTime}
                  onChange={onChange}
                />
              </div>
            </div>
            <div>
              <div className={styles.sectionTitle}>End Time</div>
              <div className={styles.inputBox}>
                <input
                  className={styles.input}
                  type="datetime-local"
                  name="EndDateTime"
                  value={form.EndDateTime}
                  onChange={onChange}
                />
              </div>
            </div>
          </div>

          <div className={styles.sectionTitle}>Location</div>
          <div className={styles.formGroup}>
            <input
              className={styles.input}
              name="Location"
              value={form.Location}
              onChange={onChange}
              placeholder="Building / Room / Floor"
            />
          </div>

          <div className={styles.twoCol}>
            <div>
              <div className={styles.sectionTitle}>Max Participant</div>
              <div className={styles.inputBox}>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  name="MaxParticipant"
                  value={form.MaxParticipant}
                  onChange={onChange}
                />
              </div>
            </div>
            <div>
              <div className={styles.sectionTitle}>Max Staff</div>
              <div className={styles.inputBox}>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  name="MaxStaff"
                  value={form.MaxStaff}
                  onChange={onChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT column (ภาพ + ปฏิทิน placeholder) */}
        <div className={styles.right}>
          <div className={styles.imageCard}>
            <div className={styles.imageBox}>
              {form.ImagePath ? (
                <img src={`${fileBase}/${form.ImagePath}`} alt="event" />
              ) : (
                <img
                  src="https://via.placeholder.com/600x750?text=Event+Image"
                  alt="placeholder"
                />
              )}
            </div>
          </div>

          <div className={styles.calendarCard}>
            <div style={{ opacity: 0.6 }}>Calendar here</div>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button className={styles.saveBtn} onClick={onResubmit}>
          Save Edit
        </button>
      </div>
    </div>
  );
}
