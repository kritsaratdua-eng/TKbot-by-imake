// ใส่โค้ดสำหรับทดสอบที่นี่; ส่วนนี้จะไม่ถูกคอมไพล์เมื่อแพ็กเกจนี้ถูกใช้เป็นไลบรารี

// ตัวอย่างการใช้งาน AprilTag
// Example AprilTag usage

// เชื่อมต่อกล้อง AI ก่อน
// IMAKE.aiConnect()

// ตั้งค่าเป็นโหมด AprilTag
// IMAKE.setAprilTagMode()

// ตัวอย่าง: วิ่งตาม AprilTag หมายเลข 1
// basic.forever(() => {
//     IMAKE.followAprilTag(1, 50)
//     basic.pause(100)
// })

// ตัวอย่าง: หยุดเมื่อตรวจพบ AprilTag หมายเลข 2 ในระยะ 20 ซม.
// basic.forever(() => {
//     IMAKE.aiRequestData()
//     if (IMAKE.isAprilTagDetected(2)) {
//         let distance = IMAKE.getAprilTagDistance(2)
//         IMAKE.stopAtAprilTag(2, 20)
//         IMAKE.move(IMAKE.Direction.forward, 30)
//     } else {
//         IMAKE.stopcar()
//     }
//     basic.pause(100)
// })

