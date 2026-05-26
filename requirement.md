หัวข้อ: หาฟรีแลนซ์พัฒนาโปรแกรมระบบสต๊อกสินค้า (Inventory Management)

รายละเอียดงาน:

ต้องการพัฒนาโปรแกรมจัดการสต๊อกสินค้าสำหรับธุรกิจ โรงงานผลิตพาเลทไม้ โดยต้องการระบบที่มีฟังก์ชันพื้นฐานดังนี้:

ระบบสินค้า: เพิ่ม/ลด/แก้ไข รายชื่อสินค้า, ใส่รูปภาพ, บาร์โค้ด, และราคาทุน/ราคาขายได้
ระบบรับ-จ่าย: บันทึกการนำสินค้าเข้า (Stock In) และการเบิกจ่ายสินค้าออก (Stock Out) พร้อมระบุเหตุผล
ระบบแจ้งเตือน: แจ้งเตือนเมื่อสินค้าในสต๊อกเหลือต่ำกว่าจำนวนที่กำหนด (Low Stock Alert)
ระบบรายงาน: ดูประวัติการเข้า-ออกย้อนหลัง และสรุปยอดคงเหลือ (Export เป็น Excel หรือ PDF ได้)
เว็บแอปพลิเคชัน (Web App) ใช้งานผ่านเบราว์เซอร์ รองรับทั้งมือถือและคอมพิวเตอร์
ออกแบบหน้าตาโปรแกรม (UI) ได้ใช้งานง่าย ไม่ซับซ้อน

---

## Requirement หลักของระบบ (ฉบับเต็ม)

### ระบบสินค้า (Item Master)
- เพิ่ม / แก้ไข / ลบสินค้า
- รองรับรูปภาพสินค้า
- Barcode / QR Code
- กำหนดหน่วยสินค้า
- ราคาทุน / ราคาขาย
- แยกประเภทสินค้า: วัตถุดิบ / WIP / สินค้าสำเร็จรูป

### ระบบคลังสินค้า (Inventory Management)
- รับสินค้าเข้า (Stock In)
- เบิกสินค้าออก (Stock Out)
- โอนย้ายสินค้า (Transfer)
- ปรับสต๊อก (Adjust)
- ดู Stock Card / Movement
- แจ้งเตือน Low Stock

### ระบบการผลิต (Production Process / WIP)
- รองรับการผลิตหลาย Process: ปอกไม้, อบไม้, ตัด/ไส, ประกอบ, แพ็คสินค้า
- คีย์ผลผลิตในแต่ละ Process
- คีย์ของเสีย (Scrap / Loss)
- แสดง WIP คงเหลือในแต่ละขั้นตอน
- ติดตามสถานะงานระหว่างผลิต
- คำนวณ Yield ของแต่ละ Process
- แสดงต้นทุนสะสมระหว่างการผลิต

### ระบบต้นทุน (Costing)
- ต้นทุนวัตถุดิบ
- ต้นทุน WIP
- ต้นทุนสินค้าสำเร็จรูป
- ต้นทุนต่อ Lot / Batch
- ต้นทุนคงเหลือในสต๊อก

### ระบบรายงาน (Reporting)
- รายงาน Stock Balance
- Inbound / Outbound
- WIP Report
- Production Summary
- Inventory Movement
- Cost Summary
- Export Excel / PDF

### เชื่อมต่อโปรแกรมบัญชี Express
- Export ข้อมูลไปยัง Express: รับเข้า/เบิกจ่าย, ต้นทุนสินค้า, Movement Stock
- รองรับ Export Excel / CSV เพื่อลดการคีย์ข้อมูลซ้ำ

---

## ขอบเขตการพัฒนา (Scope)

### ✅ Phase ปัจจุบัน — ทำได้ง่าย ใช้ Stack ปัจจุบัน
| ระบบ | Feature ที่พัฒนา |
|---|---|
| Auth | Login/JWT, Role (admin/manager/staff), User Management |
| Item Master | CRUD, รูปภาพ, Barcode, หน่วย, ราคาทุน/ขาย, แยกประเภท (วัตถุดิบ/WIP/สำเร็จรูป) |
| Inventory | Stock In, Stock Out, Adjust, Transfer, Stock Card, Low Stock Alert |
| Reports | Stock Balance, Inbound/Outbound Movement, Export Excel/CSV |

### 🔜 Phase ถัดไป — ซับซ้อน ทำทีหลัง
| ระบบ | เหตุผลที่เลื่อน |
|---|---|
| ระบบการผลิต (WIP/Process) | ต้องออกแบบ data model เพิ่มมาก (process steps, lot tracking) |
| ระบบต้นทุน (Costing) | ขึ้นอยู่กับระบบผลิต, ต้องการ formula ต้นทุนสะสม |
| WIP Report / Production Summary / Cost Summary | ขึ้นอยู่กับระบบผลิต |
| เชื่อม Express Accounting โดยตรง | ใช้ CSV export ไปก่อน, direct API sync ทำทีหลัง |