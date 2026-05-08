// ใส่โค้ดสำหรับทดสอบที่นี่; ส่วนนี้จะไม่ถูกคอมไพล์เมื่อแพ็กเกจนี้ถูกใช้เป็นไลบรารี

// ตัวอย่างการใช้งาน AprilTag
// Example AprilTag usage

// เชื่อมต่อกล้อง AI ก่อน
// TinkerBott.aiConnect()

// ตั้งค่าเป็นโหมด AprilTag
// TinkerBott.setAprilTagMode()

// ตัวอย่าง: วิ่งตาม AprilTag หมายเลข 1
// basic.forever(() => {
//     TinkerBott.followAprilTag(1, 50)
//     basic.pause(100)
// })

// ตัวอย่าง: หยุดเมื่อตรวจพบ AprilTag หมายเลข 2 ในระยะ 20 ซม.
// basic.forever(() => {
//     TinkerBott.aiRequestData()
//     if (TinkerBott.isAprilTagDetected(2)) {
//         let distance = TinkerBott.getAprilTagDistance(2)
//         TinkerBott.stopAtAprilTag(2, 20)
//         TinkerBott.move(TinkerBott.Direction.forward, 30)
//     } else {
//         TinkerBott.stopcar()
//     }
//     basic.pause(100)
// })
