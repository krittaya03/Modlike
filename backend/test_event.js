// test-db-insert.js

// 1. Import connection pool ที่เราสร้างไว้จากไฟล์ db.js
const db = require('./db');

// 2. สร้างฟังก์ชัน async เพื่อให้เราสามารถใช้ await ได้
async function insertTestData() {
  console.log('🚀 Attempting to insert test data...');

  try {
    // 3. เขียนคำสั่ง SQL INSERT
    // **สำคัญ:** แก้ไขชื่อตาราง (your_table_name) และชื่อคอลัมน์ (column1, column2, ...)
    // ให้ตรงกับโครงสร้างฐานข้อมูลของคุณ
    const sql = `
      INSERT INTO event (EventName, EventOrgID, StartDateTime, EndDateTime, Location, Status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    // 4. เตรียมข้อมูลที่จะใส่ลงไป (ควรจะตรงกับจำนวน '?' ใน SQL)
    const testEventData = [
      'My Awesome Test Event',
      1,     // <--- แก้เป็นเลข 1 (หรือ ID ของ organizer ที่คุณเพิ่งสร้าง)
      '2024-10-26 18:00:00',
      '2024-10-26 22:00:00',
      'Bangkok, Thailand',
      'Draft'
    ];

    // 5. สั่งให้ database ทำงาน (execute the query)
    const [result] = await db.query(sql, testEventData);

    // 6. แสดงผลลัพธ์
    console.log('✅ Success! Data inserted.');
    console.log('Inserted with ID:', result.insertId); // แสดง ID ของแถวที่เพิ่งเพิ่มเข้าไป

  } catch (err) {
    // 7. จัดการกับข้อผิดพลาด
    console.error('❌ Error inserting data:', err.message);
    console.error('Stack Trace:', err.stack);
  } finally {
    // 8. ปิดการเชื่อมต่อทั้งหมดใน pool (สำคัญมาก!)
    // เพื่อให้ script จบการทำงาน ไม่ค้าง
    console.log('👋 Closing database connection pool...');
    await db.end();
  }
}

// 9. เรียกฟังก์ชันที่เราสร้างขึ้นมาให้ทำงาน
insertTestData();