// ============================================
// Chi hội Members Data
// ============================================

const chiHoiMembers = [
    { stt: 1, hoTen: "Nguyễn Văn An", namSinh: 1950, diaChi: "Số 1, Đường A, Phường X", dongHoiPhi: true },
    { stt: 2, hoTen: "Trần Thị Bình", namSinh: 1952, diaChi: "Số 2, Đường B, Phường X", dongHoiPhi: true },
    { stt: 3, hoTen: "Lê Văn Cường", namSinh: 1955, diaChi: "Số 3, Đường C, Phường X", dongHoiPhi: false },
    { stt: 4, hoTen: "Phạm Thị Dung", namSinh: 1960, diaChi: "Số 4, Đường D, Phường X", dongHoiPhi: true },
    { stt: 5, hoTen: "Hoàng Văn Em", namSinh: 1948, diaChi: "Số 5, Đường E, Phường X", dongHoiPhi: true },
    { stt: 6, hoTen: "Ngô Thị Phương", namSinh: 1958, diaChi: "Số 6, Đường F, Phường X", dongHoiPhi: false },
    { stt: 7, hoTen: "Đỗ Văn Giang", namSinh: 1962, diaChi: "Số 7, Đường G, Phường X", dongHoiPhi: true },
    { stt: 8, hoTen: "Vũ Thị Hương", namSinh: 1953, diaChi: "Số 8, Đường H, Phường X", dongHoiPhi: true },
    { stt: 9, hoTen: "Nguyễn Văn Inh", namSinh: 1957, diaChi: "Số 9, Đường I, Phường X", dongHoiPhi: false },
    { stt: 10, hoTen: "Trần Văn Kha", namSinh: 1951, diaChi: "Số 10, Đường K, Phường X", dongHoiPhi: true },
    // Thêm nhiều thành viên hơn để đạt 300 người
    // ... (có thể tạo tự động hoặc thêm thủ công)
];

// Tạo thêm dữ liệu mẫu cho 300 thành viên
for (let i = 11; i <= 300; i++) {
    chiHoiMembers.push({
        stt: i,
        hoTen: `Thành viên ${i}`,
        namSinh: 1950 + Math.floor(Math.random() * 20),
        diaChi: `Số ${i}, Đường ${String.fromCharCode(65 + (i % 26))}, Phường X`,
        dongHoiPhi: Math.random() > 0.2
    });
}