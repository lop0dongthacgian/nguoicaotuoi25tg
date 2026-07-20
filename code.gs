/**
 * ============================================================================
 *  CHĂM SÓC NGƯỜI CAO TUỔI - BACKEND (Google Apps Script)
 * ============================================================================
 *  File này đóng vai trò API trung gian giữa giao diện web (index.html/app.js)
 *  và Google Sheets (nơi lưu toàn bộ dữ liệu).
 *
 *  CÁCH HOẠT ĐỘNG:
 *   - Yêu cầu GET  -> dùng để ĐỌC dữ liệu (vd: ?action=getThongBao)
 *   - Yêu cầu POST -> dùng để GHI dữ liệu (thêm/sửa/xóa/đăng nhập...)
 *   - Toàn bộ dữ liệu được lưu trong 1 Google Sheet (Spreadsheet) có nhiều
 *     "Sheet" con: ThongBao, GopY, BaoTin, TaiChinh, UngHo, CauHinh
 *   - Nếu các Sheet trên chưa tồn tại, script sẽ TỰ ĐỘNG TẠO khi chạy lần đầu.
 *
 *  CÀI ĐẶT: xem file HUONG_DAN_TRIEN_KHAI.md để biết cách triển khai.
 * ============================================================================
 */

// ID của Google Sheet dùng làm cơ sở dữ liệu.
// Để trống ('') để script tự dùng Spreadsheet đang gắn với Apps Script này,
// hoặc dán ID của Google Sheet có sẵn vào giữa hai dấu nháy đơn.
const SPREADSHEET_ID = '1wwLRplhGmoHA5lzlur8TTjBB6Pnjw9XaS2Rkq5HPJms';

// Tên các Sheet (tab) sẽ được tự động tạo trong Google Sheet
const SHEET_NAMES = {
  THONG_BAO: 'ThongBao',
  GOP_Y: 'GopY',
  BAO_TIN: 'BaoTin',
  TAI_CHINH: 'TaiChinh',
  UNG_HO: 'UngHo',
  CAU_HINH: 'CauHinh'
};

// Cấu trúc cột (header) cho từng Sheet
const SHEET_HEADERS = {
  ThongBao: ['ID', 'TieuDe', 'NoiDung', 'NguoiDang', 'ThoiGian', 'HinhAnh', 'Ghim'],
  GopY: ['ID', 'HoTen', 'SoDienThoai', 'NoiDung', 'ThoiGian'],
  BaoTin: ['ID', 'NguoiBao', 'SoDienThoai', 'NguoiCaoTuoi', 'LoaiTin', 'NoiDung', 'ThoiGian', 'DaXuLy'],
  TaiChinh: ['ID', 'Ngay', 'NoiDung', 'Thu', 'Chi'],
  UngHo: ['ID', 'NguoiUngHo', 'SoTien', 'Ngay', 'NoiDung'],
  CauHinh: ['Key', 'Value']
};

// Giá trị cấu hình mặc định khi tạo Sheet CauHinh lần đầu
const DEFAULT_CONFIG = {
  AdminPassword: 'admin2026',
  SoTaiKhoan: '0000 0000 0000',
  ChuTaiKhoan: 'HOI NGUOI CAO TUOI',
  NganHang: 'Ngan hang TMCP...',
  QRUrl: '',
  NoiDungChuyenKhoan: 'Ung ho quy cham soc NCT'
};

/**
 * ---------------------------------------------------------------------------
 *  ĐIỂM VÀO CHÍNH: doGet / doPost
 * ---------------------------------------------------------------------------
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    let result;

    switch (action) {
      case 'getThongBao':
        result = getThongBao();
        break;
      case 'getGopY':
        requireAdmin(e.parameter.password);
        result = getGopY();
        break;
      case 'getBaoTin':
        requireAdmin(e.parameter.password);
        result = getBaoTin();
        break;
      case 'getTaiChinh':
        result = getTaiChinh();
        break;
      case 'getUngHo':
        result = getUngHo();
        break;
      case 'getCauHinh':
        result = getCauHinhCongKhai();
        break;
      default:
        throw new Error('Hành động không hợp lệ: ' + action);
    }

    return jsonResponse({ ok: true, data: result });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function doPost(e) {
  try {
    // Dữ liệu được gửi dạng text/plain để tránh lỗi CORS preflight,
    // nên ta cần tự parse chuỗi JSON.
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    let result;

    switch (action) {
      // ---- Thông báo ----
      case 'addThongBao':
        requireAdmin(body.password);
        result = addThongBao(body.data);
        break;
      case 'updateThongBao':
        requireAdmin(body.password);
        result = updateThongBao(body.data);
        break;
      case 'deleteThongBao':
        requireAdmin(body.password);
        result = deleteRowById(SHEET_NAMES.THONG_BAO, body.id);
        break;

      // ---- Góp ý ----
      case 'addGopY':
        result = addGopY(body.data); // Thành viên gửi, không cần mật khẩu
        break;
      case 'deleteGopY':
        requireAdmin(body.password);
        result = deleteRowById(SHEET_NAMES.GOP_Y, body.id);
        break;

      // ---- Báo tin sức khỏe ----
      case 'addBaoTin':
        result = addBaoTin(body.data); // Thành viên gửi, không cần mật khẩu
        break;
      case 'markBaoTinProcessed':
        requireAdmin(body.password);
        result = markBaoTinProcessed(body.id);
        break;
      case 'deleteBaoTin':
        requireAdmin(body.password);
        result = deleteRowById(SHEET_NAMES.BAO_TIN, body.id);
        break;

      // ---- Tài chính ----
      case 'addTaiChinh':
        requireAdmin(body.password);
        result = addTaiChinh(body.data);
        break;
      case 'updateTaiChinh':
        requireAdmin(body.password);
        result = updateTaiChinh(body.data);
        break;
      case 'deleteTaiChinh':
        requireAdmin(body.password);
        result = deleteRowById(SHEET_NAMES.TAI_CHINH, body.id);
        break;

      // ---- Quỹ ủng hộ ----
      case 'addUngHo':
        requireAdmin(body.password);
        result = addUngHo(body.data);
        break;
      case 'updateUngHo':
        requireAdmin(body.password);
        result = updateUngHo(body.data);
        break;
      case 'deleteUngHo':
        requireAdmin(body.password);
        result = deleteRowById(SHEET_NAMES.UNG_HO, body.id);
        break;

      // ---- Cấu hình quỹ (số TK, QR...) ----
      case 'updateCauHinh':
        requireAdmin(body.password);
        result = updateCauHinh(body.data);
        break;

      // ---- Đăng nhập / mật khẩu ----
      case 'loginAdmin':
        result = loginAdmin(body.password);
        break;
      case 'changePassword':
        result = changePassword(body.oldPassword, body.newPassword);
        break;

      default:
        throw new Error('Hành động không hợp lệ: ' + action);
    }

    return jsonResponse({ ok: true, data: result });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

/**
 * ---------------------------------------------------------------------------
 *  TIỆN ÍCH DÙNG CHUNG
 * ---------------------------------------------------------------------------
 */

// Trả JSON về cho trình duyệt
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Lấy Spreadsheet đang dùng (theo ID cấu hình, hoặc Spreadsheet gắn kèm script)
function getSpreadsheet() {
  return SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

// Lấy 1 Sheet theo tên, tự tạo kèm dòng tiêu đề nếu chưa tồn tại
function getSheet(name) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(SHEET_HEADERS[name]);
    sheet.setFrozenRows(1);
    // Nếu là Sheet cấu hình, chèn sẵn giá trị mặc định
    if (name === SHEET_NAMES.CAU_HINH) {
      Object.keys(DEFAULT_CONFIG).forEach(function (key) {
        sheet.appendRow([key, DEFAULT_CONFIG[key]]);
      });
    }
  }
  return sheet;
}

// Đọc toàn bộ dữ liệu 1 sheet thành mảng object {header: value}
function readAllRows(name) {
  const sheet = getSheet(name);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    // Bỏ qua dòng trống hoàn toàn
    if (row.join('') === '') continue;
    const obj = {};
    headers.forEach(function (h, idx) {
      obj[h] = row[idx];
    });
    obj._row = i + 1; // vị trí dòng thực tế trong sheet (để sửa/xóa)
    rows.push(obj);
  }
  return rows;
}

// Sinh ID duy nhất đơn giản (thời gian + số ngẫu nhiên)
function generateId() {
  return Date.now().toString(36) + Math.floor(Math.random() * 10000).toString(36);
}

// Xóa 1 dòng theo cột ID
function deleteRowById(sheetName, id) {
  const sheet = getSheet(sheetName);
  const rows = readAllRows(sheetName);
  const target = rows.find(function (r) { return String(r.ID) === String(id); });
  if (!target) throw new Error('Không tìm thấy dữ liệu để xóa.');
  sheet.deleteRow(target._row);
  return { deleted: true };
}

/**
 * ---------------------------------------------------------------------------
 *  XÁC THỰC QUẢN TRỊ
 * ---------------------------------------------------------------------------
 */
function getAdminPassword() {
  const rows = readAllRows(SHEET_NAMES.CAU_HINH);
  const row = rows.find(function (r) { return r.Key === 'AdminPassword'; });
  return row ? String(row.Value) : DEFAULT_CONFIG.AdminPassword;
}

function requireAdmin(password) {
  if (String(password) !== String(getAdminPassword())) {
    throw new Error('Mật khẩu quản trị không đúng.');
  }
  return true;
}

function loginAdmin(password) {
  requireAdmin(password);
  return { success: true };
}

function changePassword(oldPassword, newPassword) {
  requireAdmin(oldPassword);
  if (!newPassword || String(newPassword).length < 4) {
    throw new Error('Mật khẩu mới phải có ít nhất 4 ký tự.');
  }
  const sheet = getSheet(SHEET_NAMES.CAU_HINH);
  const rows = readAllRows(SHEET_NAMES.CAU_HINH);
  const row = rows.find(function (r) { return r.Key === 'AdminPassword'; });
  if (row) {
    sheet.getRange(row._row, 2).setValue(newPassword);
  } else {
    sheet.appendRow(['AdminPassword', newPassword]);
  }
  return { success: true };
}

/**
 * ---------------------------------------------------------------------------
 *  THÔNG BÁO
 * ---------------------------------------------------------------------------
 */
function getThongBao() {
  const rows = readAllRows(SHEET_NAMES.THONG_BAO);
  // Tin ghim lên đầu, còn lại sắp xếp theo thời gian mới nhất
  rows.sort(function (a, b) {
    const pinA = a.Ghim === true || a.Ghim === 'TRUE';
    const pinB = b.Ghim === true || b.Ghim === 'TRUE';
    if (pinA !== pinB) return pinA ? -1 : 1;
    return new Date(b.ThoiGian) - new Date(a.ThoiGian);
  });
  return rows;
}

function addThongBao(data) {
  const sheet = getSheet(SHEET_NAMES.THONG_BAO);
  const id = generateId();
  sheet.appendRow([
    id,
    data.TieuDe || '',
    data.NoiDung || '',
    data.NguoiDang || '',
    new Date().toISOString(),
    data.HinhAnh || '',
    !!data.Ghim
  ]);
  return { id: id };
}

function updateThongBao(data) {
  const rows = readAllRows(SHEET_NAMES.THONG_BAO);
  const target = rows.find(function (r) { return String(r.ID) === String(data.ID); });
  if (!target) throw new Error('Không tìm thấy thông báo.');
  const sheet = getSheet(SHEET_NAMES.THONG_BAO);
  sheet.getRange(target._row, 2, 1, 6).setValues([[
    data.TieuDe || target.TieuDe,
    data.NoiDung || target.NoiDung,
    data.NguoiDang || target.NguoiDang,
    target.ThoiGian,
    data.HinhAnh !== undefined ? data.HinhAnh : target.HinhAnh,
    data.Ghim !== undefined ? !!data.Ghim : target.Ghim
  ]]);
  return { updated: true };
}

/**
 * ---------------------------------------------------------------------------
 *  GÓP Ý
 * ---------------------------------------------------------------------------
 */
function getGopY() {
  const rows = readAllRows(SHEET_NAMES.GOP_Y);
  rows.sort(function (a, b) { return new Date(b.ThoiGian) - new Date(a.ThoiGian); });
  return rows;
}

function addGopY(data) {
  const sheet = getSheet(SHEET_NAMES.GOP_Y);
  const id = generateId();
  sheet.appendRow([
    id,
    data.HoTen || '',
    data.SoDienThoai || '',
    data.NoiDung || '',
    new Date().toISOString()
  ]);
  return { id: id };
}

/**
 * ---------------------------------------------------------------------------
 *  BÁO TIN SỨC KHỎE
 * ---------------------------------------------------------------------------
 */
function getBaoTin() {
  const rows = readAllRows(SHEET_NAMES.BAO_TIN);
  rows.sort(function (a, b) { return new Date(b.ThoiGian) - new Date(a.ThoiGian); });
  return rows;
}

function addBaoTin(data) {
  const sheet = getSheet(SHEET_NAMES.BAO_TIN);
  const id = generateId();
  sheet.appendRow([
    id,
    data.NguoiBao || '',
    data.SoDienThoai || '',
    data.NguoiCaoTuoi || '',
    data.LoaiTin || 'Khác',
    data.NoiDung || '',
    new Date().toISOString(),
    false
  ]);
  return { id: id };
}

function markBaoTinProcessed(id) {
  const rows = readAllRows(SHEET_NAMES.BAO_TIN);
  const target = rows.find(function (r) { return String(r.ID) === String(id); });
  if (!target) throw new Error('Không tìm thấy báo tin.');
  const sheet = getSheet(SHEET_NAMES.BAO_TIN);
  sheet.getRange(target._row, 8).setValue(true);
  return { updated: true };
}

/**
 * ---------------------------------------------------------------------------
 *  TÀI CHÍNH (CÔNG KHAI)
 * ---------------------------------------------------------------------------
 */
function getTaiChinh() {
  const rows = readAllRows(SHEET_NAMES.TAI_CHINH);
  rows.sort(function (a, b) { return new Date(a.Ngay) - new Date(b.Ngay); });
  let tongThu = 0, tongChi = 0, soDu = 0;
  rows.forEach(function (r) {
    const thu = Number(r.Thu) || 0;
    const chi = Number(r.Chi) || 0;
    tongThu += thu;
    tongChi += chi;
    soDu += thu - chi;
    r.SoDu = soDu; // số dư lũy kế đến dòng này
  });
  return { danhSach: rows, tongThu: tongThu, tongChi: tongChi, soDu: soDu };
}

function addTaiChinh(data) {
  const sheet = getSheet(SHEET_NAMES.TAI_CHINH);
  const id = generateId();
  sheet.appendRow([
    id,
    data.Ngay || new Date().toISOString(),
    data.NoiDung || '',
    Number(data.Thu) || 0,
    Number(data.Chi) || 0
  ]);
  return { id: id };
}

function updateTaiChinh(data) {
  const rows = readAllRows(SHEET_NAMES.TAI_CHINH);
  const target = rows.find(function (r) { return String(r.ID) === String(data.ID); });
  if (!target) throw new Error('Không tìm thấy khoản thu/chi.');
  const sheet = getSheet(SHEET_NAMES.TAI_CHINH);
  sheet.getRange(target._row, 2, 1, 4).setValues([[
    data.Ngay || target.Ngay,
    data.NoiDung || target.NoiDung,
    data.Thu !== undefined ? Number(data.Thu) : target.Thu,
    data.Chi !== undefined ? Number(data.Chi) : target.Chi
  ]]);
  return { updated: true };
}

/**
 * ---------------------------------------------------------------------------
 *  QUỸ ỦNG HỘ
 * ---------------------------------------------------------------------------
 */
function getUngHo() {
  const rows = readAllRows(SHEET_NAMES.UNG_HO);
  rows.sort(function (a, b) { return new Date(b.Ngay) - new Date(a.Ngay); });
  let tongUngHo = 0;
  rows.forEach(function (r) { tongUngHo += Number(r.SoTien) || 0; });
  return { danhSach: rows, tongUngHo: tongUngHo };
}

function addUngHo(data) {
  const sheet = getSheet(SHEET_NAMES.UNG_HO);
  const id = generateId();
  sheet.appendRow([
    id,
    data.NguoiUngHo || 'Ẩn danh',
    Number(data.SoTien) || 0,
    data.Ngay || new Date().toISOString(),
    data.NoiDung || ''
  ]);
  return { id: id };
}

function updateUngHo(data) {
  const rows = readAllRows(SHEET_NAMES.UNG_HO);
  const target = rows.find(function (r) { return String(r.ID) === String(data.ID); });
  if (!target) throw new Error('Không tìm thấy khoản ủng hộ.');
  const sheet = getSheet(SHEET_NAMES.UNG_HO);
  sheet.getRange(target._row, 2, 1, 4).setValues([[
    data.NguoiUngHo || target.NguoiUngHo,
    data.SoTien !== undefined ? Number(data.SoTien) : target.SoTien,
    data.Ngay || target.Ngay,
    data.NoiDung !== undefined ? data.NoiDung : target.NoiDung
  ]]);
  return { updated: true };
}

/**
 * ---------------------------------------------------------------------------
 *  CẤU HÌNH (số tài khoản, QR, tên chủ TK...)
 * ---------------------------------------------------------------------------
 */
function getCauHinhCongKhai() {
  const rows = readAllRows(SHEET_NAMES.CAU_HINH);
  const obj = {};
  rows.forEach(function (r) {
    if (r.Key !== 'AdminPassword') obj[r.Key] = r.Value; // không lộ mật khẩu
  });
  return obj;
}

function updateCauHinh(data) {
  const sheet = getSheet(SHEET_NAMES.CAU_HINH);
  const rows = readAllRows(SHEET_NAMES.CAU_HINH);
  Object.keys(data).forEach(function (key) {
    if (key === 'AdminPassword') return; // đổi mật khẩu phải qua changePassword
    const row = rows.find(function (r) { return r.Key === key; });
    if (row) {
      sheet.getRange(row._row, 2).setValue(data[key]);
    } else {
      sheet.appendRow([key, data[key]]);
    }
  });
  return { updated: true };
}
