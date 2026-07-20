/**
 * ============================================================================
 *  DANH SÁCH THÀNH VIÊN CHI HỘI
 * ============================================================================
 *  Đây là nguồn dữ liệu TĨNH cho mục "Thành viên Chi hội".
 *  Ứng dụng đọc trực tiếp mảng DANH_SACH_CHI_HOI bên dưới (không qua
 *  Google Sheets), đúng theo yêu cầu ban đầu.
 *
 *  CÁCH THÊM/SỬA THÀNH VIÊN:
 *   - Thêm 1 dòng { ... } mới vào mảng, hoặc sửa trực tiếp dữ liệu có sẵn.
 *   - "daDongHoiPhi": true  -> hiển thị dấu ✓ (đã đóng hội phí)
 *   - "daDongHoiPhi": false -> hiển thị chưa đóng
 *   - File này hỗ trợ tới hàng trăm thành viên (đã tối ưu cho ~300 thành viên).
 *
 *  Dữ liệu mẫu dưới đây gồm 24 thành viên minh họa. Hãy thay thế / bổ sung
 *  bằng danh sách thật của chi hội bạn.
 * ============================================================================
 */

const DANH_SACH_CHI_HOI = [
  { stt: 1, hoTen: 'Nguyễn Văn An', namSinh: 1948, diaChi: 'Tổ 1, Khu phố 1', daDongHoiPhi: true },
  { stt: 2, hoTen: 'Trần Thị Bình', namSinh: 1951, diaChi: 'Tổ 1, Khu phố 1', daDongHoiPhi: true },
  { stt: 3, hoTen: 'Lê Văn Cường', namSinh: 1945, diaChi: 'Tổ 2, Khu phố 1', daDongHoiPhi: false },
  { stt: 4, hoTen: 'Phạm Thị Dung', namSinh: 1953, diaChi: 'Tổ 2, Khu phố 1', daDongHoiPhi: true },
  { stt: 5, hoTen: 'Hoàng Văn Em', namSinh: 1947, diaChi: 'Tổ 3, Khu phố 1', daDongHoiPhi: true },
  { stt: 6, hoTen: 'Vũ Thị Gấm', namSinh: 1950, diaChi: 'Tổ 3, Khu phố 2', daDongHoiPhi: false },
  { stt: 7, hoTen: 'Đặng Văn Hùng', namSinh: 1944, diaChi: 'Tổ 4, Khu phố 2', daDongHoiPhi: true },
  { stt: 8, hoTen: 'Bùi Thị Inh', namSinh: 1955, diaChi: 'Tổ 4, Khu phố 2', daDongHoiPhi: true },
  { stt: 9, hoTen: 'Ngô Văn Khải', namSinh: 1946, diaChi: 'Tổ 5, Khu phố 2', daDongHoiPhi: false },
  { stt: 10, hoTen: 'Dương Thị Lan', namSinh: 1952, diaChi: 'Tổ 5, Khu phố 3', daDongHoiPhi: true },
  { stt: 11, hoTen: 'Lý Văn Minh', namSinh: 1949, diaChi: 'Tổ 6, Khu phố 3', daDongHoiPhi: true },
  { stt: 12, hoTen: 'Đỗ Thị Nga', namSinh: 1954, diaChi: 'Tổ 6, Khu phố 3', daDongHoiPhi: false },
  { stt: 13, hoTen: 'Phan Văn Oanh', namSinh: 1943, diaChi: 'Tổ 7, Khu phố 3', daDongHoiPhi: true },
  { stt: 14, hoTen: 'Trịnh Thị Phượng', namSinh: 1956, diaChi: 'Tổ 7, Khu phố 4', daDongHoiPhi: true },
  { stt: 15, hoTen: 'Đinh Văn Quang', namSinh: 1948, diaChi: 'Tổ 8, Khu phố 4', daDongHoiPhi: false },
  { stt: 16, hoTen: 'Hồ Thị Rạng', namSinh: 1951, diaChi: 'Tổ 8, Khu phố 4', daDongHoiPhi: true },
  { stt: 17, hoTen: 'Mai Văn Sơn', namSinh: 1945, diaChi: 'Tổ 9, Khu phố 5', daDongHoiPhi: true },
  { stt: 18, hoTen: 'Tô Thị Thanh', namSinh: 1953, diaChi: 'Tổ 9, Khu phố 5', daDongHoiPhi: true },
  { stt: 19, hoTen: 'Chu Văn Uy', namSinh: 1947, diaChi: 'Tổ 10, Khu phố 5', daDongHoiPhi: false },
  { stt: 20, hoTen: 'Lương Thị Vân', namSinh: 1950, diaChi: 'Tổ 10, Khu phố 6', daDongHoiPhi: true },
  { stt: 21, hoTen: 'Tạ Văn Xuân', namSinh: 1944, diaChi: 'Tổ 11, Khu phố 6', daDongHoiPhi: true },
  { stt: 22, hoTen: 'Cao Thị Yến', namSinh: 1957, diaChi: 'Tổ 11, Khu phố 6', daDongHoiPhi: false },
  { stt: 23, hoTen: 'Kiều Văn Ánh', namSinh: 1946, diaChi: 'Tổ 12, Khu phố 7', daDongHoiPhi: true },
  { stt: 24, hoTen: 'Văn Thị Ban', namSinh: 1952, diaChi: 'Tổ 12, Khu phố 7', daDongHoiPhi: true }
];

// Xuất ra biến toàn cục để app.js sử dụng
window.DANH_SACH_CHI_HOI = DANH_SACH_CHI_HOI;
