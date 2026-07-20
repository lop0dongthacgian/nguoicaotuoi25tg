/**
 * ============================================================================
 *  CHĂM SÓC NGƯỜI CAO TUỔI — APP.JS
 * ============================================================================
 *  Toàn bộ logic giao diện: gọi API Google Apps Script, điều hướng màn hình,
 *  accordion, biểu mẫu, khu vực quản trị, chế độ tối, thông báo (toast)...
 *
 *  Trước khi sử dụng: thay CONFIG.API_URL bằng đường dẫn Web App của bạn
 *  (xem HUONG_DAN_TRIEN_KHAI.md).
 * ============================================================================
 */

// ============================================================================
// 1. CẤU HÌNH
// ============================================================================
const CONFIG = {
  // Dán URL Web App Google Apps Script của bạn vào đây (kết thúc bằng /exec)
  API_URL: 'https://script.google.com/macros/s/AKfycbxnTJBlqEEvTSBFjiQsks8g8H6LY9gij9-Q1UpBR1rCSBIRVvsaWv6C-YjduaPIOrk/exec',
  AUTO_SYNC_MS: 60000 // tự động đồng bộ mỗi 60 giây
};

// Trạng thái chung của ứng dụng, giữ trong bộ nhớ khi chạy
const STATE = {
  isAdmin: false,
  adminPassword: '',
  currentView: 'view-home',
  cache: { thongBao: [], gopY: [], baoTin: [], taiChinh: null, ungHo: null, cauHinh: {} },
  currentBaoTinLoai: 'Đau ốm'
};

// ============================================================================
// 2. LỚP GIAO TIẾP API (fetch tới Google Apps Script)
// ============================================================================
const Api = {
  // Đọc dữ liệu (GET) — dùng cho các thao tác chỉ xem
  async get(action, params) {
    if (!CONFIG.API_URL || CONFIG.API_URL.indexOf('YOUR_DEPLOYMENT_ID') !== -1) {
      throw new Error('Chưa cấu hình API_URL. Vui lòng xem HUONG_DAN_TRIEN_KHAI.md');
    }
    const url = new URL(CONFIG.API_URL);
    url.searchParams.set('action', action);
    Object.keys(params || {}).forEach(function (k) { url.searchParams.set(k, params[k]); });
    const res = await fetch(url.toString(), { method: 'GET' });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Có lỗi xảy ra khi tải dữ liệu.');
    return json.data;
  },

  // Ghi dữ liệu (POST) — dùng "text/plain" để tránh lỗi CORS preflight
  // (đây là kỹ thuật chuẩn khi gọi Google Apps Script từ trình duyệt)
  async post(action, data, extra) {
    if (!CONFIG.API_URL || CONFIG.API_URL.indexOf('YOUR_DEPLOYMENT_ID') !== -1) {
      throw new Error('Chưa cấu hình API_URL. Vui lòng xem HUONG_DAN_TRIEN_KHAI.md');
    }
    const payload = Object.assign({ action: action, data: data || {} }, extra || {});
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Có lỗi xảy ra khi lưu dữ liệu.');
    return json.data;
  }
};

// ============================================================================
// 3. TIỆN ÍCH DÙNG CHUNG
// ============================================================================
function formatVND(n) {
  const num = Number(n) || 0;
  return num.toLocaleString('vi-VN') + ' ₫';
}

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(message, type) {
  const host = document.getElementById('toast-host');
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  const icon = type === 'error' ? 'error' : (type === 'success' ? 'check_circle' : 'info');
  el.innerHTML = '<span class="material-symbols-rounded" style="font-size:18px;">' + icon + '</span>' + escapeHtml(message);
  host.appendChild(el);
  setTimeout(function () {
    el.style.transition = 'opacity 260ms ease';
    el.style.opacity = '0';
    setTimeout(function () { el.remove(); }, 280);
  }, 2600);
}

function setLoading(el) {
  el.innerHTML = '<div class="loading-row"><span class="spinner"></span> Đang tải...</div>';
}

function setEmpty(el, message, icon) {
  el.innerHTML = '<div class="empty-state"><span class="material-symbols-rounded">' + (icon || 'inbox') +
    '</span><p>' + escapeHtml(message) + '</p></div>';
}

// ---- Modal (bottom sheet) dùng chung ----
const Modal = {
  open(html) {
    document.getElementById('modal-content').innerHTML = html;
    document.getElementById('modal-host').classList.add('open');
  },
  close() {
    document.getElementById('modal-host').classList.remove('open');
  }
};
document.getElementById('modal-host').addEventListener('click', function (e) {
  if (e.target.classList.contains('backdrop')) Modal.close();
});

// ============================================================================
// 4. KHỞI ĐỘNG ỨNG DỤNG (SPLASH SCREEN)
// ============================================================================
window.addEventListener('DOMContentLoaded', function () {
  initTheme();
  restoreAdminSession();

  setTimeout(function () {
    document.getElementById('splash').classList.add('hidden');
  }, 1200);

  bindGateEvents();
  bindHeaderEvents();
  bindNavEvents();
  bindAccordionEvents();
  bindFormEvents();
  bindAccountEvents();
  bindAdminEvents();
  bindPasswordToggles();
});

// ============================================================================
// 5. CHẾ ĐỘ TỐI (DARK MODE)
// ============================================================================
function initTheme() {
  const saved = localStorage.getItem('ncto-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('ncto-theme', theme);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ============================================================================
// 6. PHIÊN ĐĂNG NHẬP QUẢN TRỊ (lưu trong sessionStorage — mất khi đóng tab)
// ============================================================================
function restoreAdminSession() {
  const pw = sessionStorage.getItem('ncto-admin-pw');
  if (pw) {
    STATE.isAdmin = true;
    STATE.adminPassword = pw;
  }
}
function setAdminSession(password) {
  STATE.isAdmin = true;
  STATE.adminPassword = password;
  sessionStorage.setItem('ncto-admin-pw', password);
  refreshAccountUI();
}
function clearAdminSession() {
  STATE.isAdmin = false;
  STATE.adminPassword = '';
  sessionStorage.removeItem('ncto-admin-pw');
  refreshAccountUI();
  refreshAccountNavDot();
}
function refreshAccountUI() {
  document.getElementById('account-member-box').style.display = STATE.isAdmin ? 'none' : 'block';
  document.getElementById('account-admin-box').style.display = STATE.isAdmin ? 'block' : 'none';
}

// ============================================================================
// 7. MÀN HÌNH CỔNG VÀO (chọn Thành viên / Quản trị)
// ============================================================================
function bindGateEvents() {
  document.getElementById('btn-enter-member').addEventListener('click', enterApp);

  document.getElementById('btn-show-admin').addEventListener('click', function () {
    document.getElementById('admin-login-panel').classList.toggle('open');
  });

  document.getElementById('btn-admin-login').addEventListener('click', async function () {
    const pwInput = document.getElementById('gate-admin-password');
    const password = pwInput.value.trim();
    if (!password) { showToast('Vui lòng nhập mật khẩu.', 'error'); return; }
    const btn = document.getElementById('btn-admin-login');
    btn.disabled = true;
    try {
      await Api.post('loginAdmin', {}, { password: password });
      setAdminSession(password);
      showToast('Đăng nhập quản trị thành công!', 'success');
      enterApp();
      switchView('view-account');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

function enterApp() {
  document.getElementById('gate').style.display = 'none';
  document.getElementById('app-header').style.display = 'flex';
  document.getElementById('views').style.display = 'block';
  document.getElementById('bottom-nav').style.display = 'flex';
  refreshAccountUI();
  loadAllData();
  startAutoSync();
}

// ============================================================================
// 8. HEADER
// ============================================================================
function bindHeaderEvents() {
  document.getElementById('btn-theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('btn-refresh').addEventListener('click', function () {
    showToast('Đang đồng bộ dữ liệu...', 'info');
    loadAllData();
  });
}

const VIEW_TITLES = {
  'view-home': 'Trang chủ',
  'view-chihoi': 'Chi hội',
  'view-quy': 'Quỹ ủng hộ',
  'view-account': 'Tài khoản',
  'view-admin': 'Quản trị'
};

// ============================================================================
// 9. ĐIỀU HƯỚNG (BOTTOM NAV + CHUYỂN MÀN HÌNH)
// ============================================================================
function bindNavEvents() {
  document.querySelectorAll('.nav-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { switchView(btn.dataset.view); });
  });
}

function switchView(viewId) {
  STATE.currentView = viewId;
  document.querySelectorAll('.view').forEach(function (v) { v.classList.toggle('active', v.id === viewId); });
  document.querySelectorAll('.nav-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.view === viewId);
  });
  document.getElementById('header-title-text').textContent = VIEW_TITLES[viewId] || 'Trang chủ';

  // Chỉ tô sáng nav khi view thuộc 4 tab chính (view-admin không có nút riêng)
  if (viewId === 'view-admin') {
    document.querySelectorAll('.nav-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.view === 'view-account'); });
  }
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

// ============================================================================
// 10. ACCORDION (chuyên mục trang chủ)
// ============================================================================
function bindAccordionEvents() {
  document.querySelectorAll('#home-accordion .accordion-header').forEach(function (header) {
    header.addEventListener('click', function () {
      header.closest('.accordion-item').classList.toggle('open');
    });
  });
}

// ============================================================================
// 11. TẢI TOÀN BỘ DỮ LIỆU TỪ GOOGLE SHEETS
// ============================================================================
function loadAllData() {
  loadThongBao();
  loadTaiChinh();
  loadUngHo();
  loadCauHinh();
  renderMembers(DANH_SACH_CHI_HOI);
  if (STATE.isAdmin) refreshAdminCounts();
}

let autoSyncTimer = null;
function startAutoSync() {
  if (autoSyncTimer) clearInterval(autoSyncTimer);
  autoSyncTimer = setInterval(loadAllData, CONFIG.AUTO_SYNC_MS);
}

// ---------------------------------------------------------------------------
// 📢 Thông báo
// ---------------------------------------------------------------------------
async function loadThongBao() {
  const el = document.getElementById('list-thongbao');
  try {
    const data = await Api.get('getThongBao');
    STATE.cache.thongBao = data;
    renderThongBao(data);
    if (STATE.isAdmin) renderAdminThongBao(data);
  } catch (err) {
    setEmpty(el, err.message, 'error');
  }
}

function renderThongBao(list) {
  const el = document.getElementById('list-thongbao');
  if (!list || !list.length) { setEmpty(el, 'Chưa có thông báo nào.', 'campaign'); return; }
  el.innerHTML = list.map(function (item) {
    const isPin = item.Ghim === true || item.Ghim === 'TRUE';
    return '<div class="notice-item">' +
      '<div class="notice-head">' +
        '<div class="notice-title">' + (isPin ? '<span class="badge pin">📌 Ghim</span> ' : '') + escapeHtml(item.TieuDe) + '</div>' +
      '</div>' +
      '<div class="notice-meta">' + escapeHtml(item.NguoiDang || 'Ban quản trị') + ' • ' + formatDateTime(item.ThoiGian) + '</div>' +
      '<div class="notice-body">' + escapeHtml(item.NoiDung) + '</div>' +
      (item.HinhAnh ? '<div class="notice-img"><img src="' + escapeHtml(item.HinhAnh) + '" alt="" loading="lazy"></div>' : '') +
    '</div>';
  }).join('');
}

// ---------------------------------------------------------------------------
// 👥 Thành viên chi hội
// ---------------------------------------------------------------------------
function renderMembers(list) {
  const tbody = document.getElementById('member-tbody');
  if (!list || !list.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--color-text-muted);">Không có dữ liệu.</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(function (m) {
    return '<tr>' +
      '<td>' + m.stt + '</td>' +
      '<td>' + escapeHtml(m.hoTen) + '</td>' +
      '<td>' + m.namSinh + '</td>' +
      '<td>' + escapeHtml(m.diaChi) + '</td>' +
      '<td>' + (m.daDongHoiPhi ? '<span class="tick-yes">✔</span>' : '<span class="tick-no">—</span>') + '</td>' +
    '</tr>';
  }).join('');
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('member-search').addEventListener('input', function (e) {
    const q = e.target.value.trim().toLowerCase();
    document.getElementById('btn-member-viewall').classList.toggle('active', !q);
    if (!q) { renderMembers(DANH_SACH_CHI_HOI); return; }
    const filtered = DANH_SACH_CHI_HOI.filter(function (m) { return m.hoTen.toLowerCase().indexOf(q) !== -1; });
    renderMembers(filtered);
  });
  document.getElementById('btn-member-viewall').addEventListener('click', function () {
    document.getElementById('member-search').value = '';
    this.classList.add('active');
    renderMembers(DANH_SACH_CHI_HOI);
  });
});

// ---------------------------------------------------------------------------
// 📊 Công khai tài chính
// ---------------------------------------------------------------------------
async function loadTaiChinh() {
  const el = document.getElementById('panel-taichinh');
  try {
    const data = await Api.get('getTaiChinh');
    STATE.cache.taiChinh = data;
    renderTaiChinhPublic(data);
    if (STATE.isAdmin) renderAdminTaiChinh(data);
  } catch (err) {
    setEmpty(el, err.message, 'error');
  }
}

function renderTaiChinhPublic(data) {
  const el = document.getElementById('panel-taichinh');
  const rows = data.danhSach || [];
  let html = '<div class="finance-summary">' +
    '<div class="box thu"><div class="num">' + formatVND(data.tongThu) + '</div><div class="lbl">Tổng thu</div></div>' +
    '<div class="box chi"><div class="num">' + formatVND(data.tongChi) + '</div><div class="lbl">Tổng chi</div></div>' +
    '<div class="box du"><div class="num">' + formatVND(data.soDu) + '</div><div class="lbl">Tồn quỹ</div></div>' +
  '</div>';
  if (!rows.length) {
    html += '<div class="empty-state"><span class="material-symbols-rounded">receipt_long</span><p>Chưa có dữ liệu thu chi.</p></div>';
  } else {
    html += '<div class="member-table-wrap"><table class="data-table"><thead><tr><th>Ngày</th><th>Nội dung</th><th>Thu</th><th>Chi</th><th>Số dư</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td>' + formatDate(r.Ngay) + '</td><td>' + escapeHtml(r.NoiDung) + '</td>' +
          '<td>' + (r.Thu ? formatVND(r.Thu) : '—') + '</td>' +
          '<td>' + (r.Chi ? formatVND(r.Chi) : '—') + '</td>' +
          '<td>' + formatVND(r.SoDu) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  el.innerHTML = html;
}

// ---------------------------------------------------------------------------
// 💝 Ủng hộ quỹ
// ---------------------------------------------------------------------------
async function loadUngHo() {
  const infoEl = document.getElementById('quy-info-card');
  const listEl = document.getElementById('quy-danhsach');
  try {
    const data = await Api.get('getUngHo');
    STATE.cache.ungHo = data;
    document.getElementById('quy-tongtien').textContent = formatVND(data.tongUngHo);
    const rows = data.danhSach || [];
    if (!rows.length) {
      setEmpty(listEl, 'Chưa có lượt ủng hộ nào.', 'volunteer_activism');
    } else {
      listEl.innerHTML = rows.slice(0, 30).map(function (r) {
        return '<div class="donate-info-row"><span class="label">' + escapeHtml(r.NguoiUngHo) + ' • ' + formatDate(r.Ngay) + '</span><span class="value">' + formatVND(r.SoTien) + '</span></div>';
      }).join('');
    }
    if (STATE.isAdmin) renderAdminUngHo(data);
  } catch (err) {
    setEmpty(listEl, err.message, 'error');
  }
}

async function loadCauHinh() {
  const infoEl = document.getElementById('quy-info-card');
  try {
    const cfg = await Api.get('getCauHinh');
    STATE.cache.cauHinh = cfg;
    let html = '';
    html += '<div class="donate-info-row"><span class="label">Số tài khoản</span><span class="value">' + escapeHtml(cfg.SoTaiKhoan || '—') + '</span></div>';
    html += '<div class="donate-info-row"><span class="label">Chủ tài khoản</span><span class="value">' + escapeHtml(cfg.ChuTaiKhoan || '—') + '</span></div>';
    html += '<div class="donate-info-row"><span class="label">Ngân hàng</span><span class="value">' + escapeHtml(cfg.NganHang || '—') + '</span></div>';
    html += '<div class="donate-info-row"><span class="label">Nội dung CK</span><span class="value">' + escapeHtml(cfg.NoiDungChuyenKhoan || '—') + '</span></div>';
    if (cfg.QRUrl) {
      html += '<div class="qr-box"><img src="' + escapeHtml(cfg.QRUrl) + '" alt="Mã QR chuyển khoản"></div>';
    }
    infoEl.innerHTML = html;
  } catch (err) {
    setEmpty(infoEl, err.message, 'error');
  }
}

// ============================================================================
// 12. XỬ LÝ BIỂU MẪU (Gửi ý kiến / Báo tin sức khỏe)
// ============================================================================
function bindFormEvents() {
  // ---- Gửi ý kiến ----
  document.getElementById('form-gopy').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const payload = {
      HoTen: document.getElementById('gopy-hoten').value.trim(),
      SoDienThoai: document.getElementById('gopy-sdt').value.trim(),
      NoiDung: document.getElementById('gopy-noidung').value.trim()
    };
    btn.disabled = true;
    try {
      await Api.post('addGopY', payload);
      showToast('Cảm ơn bạn đã gửi ý kiến!', 'success');
      e.target.reset();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });

  // ---- Chọn loại tin (báo tin sức khỏe) ----
  document.getElementById('bt-loaitin-group').addEventListener('click', function (e) {
    const chip = e.target.closest('.radio-chip');
    if (!chip) return;
    this.querySelectorAll('.radio-chip').forEach(function (c) { c.classList.remove('selected'); });
    chip.classList.add('selected');
    STATE.currentBaoTinLoai = chip.dataset.value;
  });

  // ---- Báo tin sức khỏe ----
  document.getElementById('form-baotin').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const payload = {
      NguoiBao: document.getElementById('bt-nguoibao').value.trim(),
      SoDienThoai: document.getElementById('bt-sdt').value.trim(),
      NguoiCaoTuoi: document.getElementById('bt-nguoicaotuoi').value.trim(),
      LoaiTin: STATE.currentBaoTinLoai,
      NoiDung: document.getElementById('bt-noidung').value.trim()
    };
    btn.disabled = true;
    try {
      await Api.post('addBaoTin', payload);
      showToast('Đã gửi báo tin. Ban quản trị sẽ liên hệ sớm.', 'success');
      e.target.reset();
      document.querySelectorAll('#bt-loaitin-group .radio-chip').forEach(function (c, i) { c.classList.toggle('selected', i === 0); });
      STATE.currentBaoTinLoai = 'Đau ốm';
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

// ============================================================================
// 13. TÀI KHOẢN (đăng nhập/đăng xuất trong tab Tài khoản)
// ============================================================================
function bindAccountEvents() {
  document.getElementById('btn-goto-admin-login').addEventListener('click', function () {
    Modal.open(
      '<div class="modal-title">Đăng nhập Quản trị</div>' +
      '<div class="form-group">' +
        '<label for="acc-admin-password">Mật khẩu quản trị</label>' +
        '<div class="password-field">' +
          '<input class="form-control" type="password" id="acc-admin-password" placeholder="Nhập mật khẩu">' +
          '<button type="button" class="password-toggle" data-toggle-for="acc-admin-password"><span class="material-symbols-rounded">visibility</span></button>' +
        '</div>' +
      '</div>' +
      '<button class="btn primary" id="btn-modal-admin-login">Đăng nhập</button>'
    );
    bindPasswordToggles();
    document.getElementById('btn-modal-admin-login').addEventListener('click', async function () {
      const password = document.getElementById('acc-admin-password').value.trim();
      if (!password) { showToast('Vui lòng nhập mật khẩu.', 'error'); return; }
      this.disabled = true;
      try {
        await Api.post('loginAdmin', {}, { password: password });
        setAdminSession(password);
        showToast('Đăng nhập thành công!', 'success');
        Modal.close();
        loadAllData();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        this.disabled = false;
      }
    });
  });

  document.getElementById('btn-open-admin-dashboard').addEventListener('click', function () {
    switchView('view-admin');
    refreshAdminCounts();
    showAdminPanelList();
  });

  document.getElementById('btn-logout-admin').addEventListener('click', function () {
    clearAdminSession();
    showToast('Đã đăng xuất quản trị.', 'info');
    switchView('view-home');
  });

  document.getElementById('btn-toggle-dark-settings').addEventListener('click', toggleTheme);
}

// ============================================================================
// 14. MẬT KHẨU: NÚT HIỆN/ẨN
// ============================================================================
function bindPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(function (btn) {
    // Tránh gắn sự kiện trùng lặp
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', function () {
      const input = document.getElementById(btn.dataset.toggleFor);
      const icon = btn.querySelector('.material-symbols-rounded');
      if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = 'visibility_off';
      } else {
        input.type = 'password';
        icon.textContent = 'visibility';
      }
    });
  });
}

// ============================================================================
// 15. BẢNG ĐIỀU KHIỂN QUẢN TRỊ
// ============================================================================
function bindAdminEvents() {
  document.getElementById('btn-admin-back').addEventListener('click', function () { switchView('view-account'); });

  document.querySelectorAll('#admin-grid .admin-tile').forEach(function (tile) {
    tile.addEventListener('click', function () { openAdminPanel(tile.dataset.panel); });
  });
  document.querySelectorAll('.admin-panel-back').forEach(function (btn) {
    btn.addEventListener('click', showAdminPanelList);
  });

  document.getElementById('btn-new-thongbao').addEventListener('click', function () { openThongBaoForm(); });
  document.getElementById('btn-new-taichinh').addEventListener('click', function () { openTaiChinhForm(); });
  document.getElementById('btn-new-unghoq').addEventListener('click', function () { openUngHoForm(); });
  document.getElementById('btn-edit-cauhinh').addEventListener('click', function () { openCauHinhForm(); });

  document.getElementById('form-doi-matkhau').addEventListener('submit', async function (e) {
    e.preventDefault();
    const oldPw = document.getElementById('mk-cu').value;
    const newPw = document.getElementById('mk-moi').value;
    const confirmPw = document.getElementById('mk-xacnhan').value;
    if (newPw !== confirmPw) { showToast('Mật khẩu xác nhận không khớp.', 'error'); return; }
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await Api.post('changePassword', {}, { oldPassword: oldPw, newPassword: newPw });
      setAdminSession(newPw);
      showToast('Đổi mật khẩu thành công!', 'success');
      e.target.reset();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

function showAdminPanelList() {
  document.getElementById('admin-grid').style.display = 'grid';
  document.querySelectorAll('.admin-panel').forEach(function (p) { p.classList.remove('active'); });
}
function openAdminPanel(panelId) {
  document.getElementById('admin-grid').style.display = 'none';
  document.querySelectorAll('.admin-panel').forEach(function (p) { p.classList.toggle('active', p.id === panelId); });
}

function refreshAdminCounts() {
  document.getElementById('count-thongbao').textContent = (STATE.cache.thongBao || []).length + ' tin';
  document.getElementById('count-gopy').textContent = (STATE.cache.gopY || []).length + ' góp ý';
  document.getElementById('count-baotin').textContent = (STATE.cache.baoTin || []).length + ' tin';
  const tc = STATE.cache.taiChinh;
  document.getElementById('count-taichinh').textContent = tc ? formatVND(tc.soDu) + ' tồn' : '—';
  const uh = STATE.cache.ungHo;
  document.getElementById('count-unghoq').textContent = uh ? formatVND(uh.tongUngHo) : '—';

  // Góp ý & báo tin cần quyền admin để tải (loadGopY/loadBaoTin riêng)
  loadGopYAdmin();
  loadBaoTinAdmin();
}

// Hiện chấm đỏ ở nút "Tài khoản" khi có báo tin sức khỏe chưa xử lý
function refreshAccountNavDot() {
  const dot = document.getElementById('account-nav-dot');
  if (!dot) return;
  const hasPending = STATE.isAdmin && (STATE.cache.baoTin || []).some(function (b) {
    return !(b.DaXuLy === true || b.DaXuLy === 'TRUE');
  });
  dot.classList.toggle('show', !!hasPending);
}

// ---------------------------------------------------------------------------
// Quản lý Thông báo
// ---------------------------------------------------------------------------
function renderAdminThongBao(list) {
  const el = document.getElementById('admin-list-thongbao');
  if (!list.length) { setEmpty(el, 'Chưa có thông báo nào.', 'campaign'); return; }
  el.innerHTML = list.map(function (item) {
    const isPin = item.Ghim === true || item.Ghim === 'TRUE';
    return '<div class="admin-list-item">' +
      '<div class="row-top"><span class="row-title">' + (isPin ? '📌 ' : '') + escapeHtml(item.TieuDe) + '</span></div>' +
      '<div class="row-meta">' + escapeHtml(item.NguoiDang) + ' • ' + formatDateTime(item.ThoiGian) + '</div>' +
      '<div class="row-body">' + escapeHtml((item.NoiDung || '').slice(0, 120)) + (item.NoiDung && item.NoiDung.length > 120 ? '…' : '') + '</div>' +
      '<div class="row-actions">' +
        '<button class="btn outline sm" data-edit-tb="' + escapeHtml(item.ID) + '">Sửa</button>' +
        '<button class="btn danger sm" data-del-tb="' + escapeHtml(item.ID) + '">Xóa</button>' +
      '</div></div>';
  }).join('');
  el.querySelectorAll('[data-edit-tb]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = list.find(function (i) { return String(i.ID) === btn.dataset.editTb; });
      openThongBaoForm(item);
    });
  });
  el.querySelectorAll('[data-del-tb]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      confirmPasswordThenRun('Xóa thông báo này?', async function (password) {
        await Api.post('deleteThongBao', {}, { id: btn.dataset.delTb, password: password });
        showToast('Đã xóa thông báo.', 'success');
        loadThongBao();
      });
    });
  });
}

function openThongBaoForm(item) {
  const isEdit = !!item;
  Modal.open(
    '<div class="modal-title">' + (isEdit ? 'Sửa thông báo' : 'Tạo thông báo mới') + '</div>' +
    '<div class="form-group"><label>Tiêu đề</label><input class="form-control" id="tb-tieude" value="' + (isEdit ? escapeHtml(item.TieuDe) : '') + '"></div>' +
    '<div class="form-group"><label>Nội dung</label><textarea class="form-control" id="tb-noidung">' + (isEdit ? escapeHtml(item.NoiDung) : '') + '</textarea></div>' +
    '<div class="form-group"><label>Người đăng</label><input class="form-control" id="tb-nguoidang" value="' + (isEdit ? escapeHtml(item.NguoiDang) : 'Ban quản trị') + '"></div>' +
    '<div class="form-group"><label>Đường dẫn hình ảnh (không bắt buộc)</label><input class="form-control" id="tb-hinhanh" placeholder="https://..." value="' + (isEdit ? escapeHtml(item.HinhAnh) : '') + '"></div>' +
    '<div class="form-group"><label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="tb-ghim" ' + (isEdit && (item.Ghim === true || item.Ghim === 'TRUE') ? 'checked' : '') + ' style="width:18px;height:18px;"> Ghim thông báo này lên đầu</label></div>' +
    '<button class="btn primary" id="btn-save-thongbao">' + (isEdit ? 'Lưu thay đổi' : 'Đăng thông báo') + '</button>'
  );
  document.getElementById('btn-save-thongbao').addEventListener('click', async function () {
    const payload = {
      TieuDe: document.getElementById('tb-tieude').value.trim(),
      NoiDung: document.getElementById('tb-noidung').value.trim(),
      NguoiDang: document.getElementById('tb-nguoidang').value.trim(),
      HinhAnh: document.getElementById('tb-hinhanh').value.trim(),
      Ghim: document.getElementById('tb-ghim').checked
    };
    if (!payload.TieuDe || !payload.NoiDung) { showToast('Vui lòng nhập tiêu đề và nội dung.', 'error'); return; }
    this.disabled = true;
    try {
      if (isEdit) {
        payload.ID = item.ID;
        await Api.post('updateThongBao', payload, { password: STATE.adminPassword });
        showToast('Đã cập nhật thông báo.', 'success');
      } else {
        await Api.post('addThongBao', payload, { password: STATE.adminPassword });
        showToast('Đã đăng thông báo.', 'success');
      }
      Modal.close();
      loadThongBao();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      this.disabled = false;
    }
  });
}

// ---------------------------------------------------------------------------
// Quản lý Góp ý
// ---------------------------------------------------------------------------
async function loadGopYAdmin() {
  if (!STATE.isAdmin) return;
  const el = document.getElementById('admin-list-gopy');
  try {
    const data = await Api.get('getGopY', { password: STATE.adminPassword });
    STATE.cache.gopY = data;
    document.getElementById('count-gopy').textContent = data.length + ' góp ý';
    if (!data.length) { setEmpty(el, 'Chưa có góp ý nào.', 'forum'); return; }
    el.innerHTML = data.map(function (item) {
      return '<div class="admin-list-item">' +
        '<div class="row-top"><span class="row-title">' + escapeHtml(item.HoTen) + '</span><span class="row-meta">' + escapeHtml(item.SoDienThoai) + '</span></div>' +
        '<div class="row-meta">' + formatDateTime(item.ThoiGian) + '</div>' +
        '<div class="row-body">' + escapeHtml(item.NoiDung) + '</div>' +
        '<div class="row-actions"><button class="btn danger sm" data-del-gy="' + escapeHtml(item.ID) + '">Xóa</button></div>' +
      '</div>';
    }).join('');
    el.querySelectorAll('[data-del-gy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        confirmPasswordThenRun('Xóa góp ý này?', async function (password) {
          await Api.post('deleteGopY', {}, { id: btn.dataset.delGy, password: password });
          showToast('Đã xóa góp ý.', 'success');
          loadGopYAdmin();
        });
      });
    });
  } catch (err) {
    setEmpty(el, err.message, 'error');
  }
}

// ---------------------------------------------------------------------------
// Quản lý Báo tin sức khỏe
// ---------------------------------------------------------------------------
async function loadBaoTinAdmin() {
  if (!STATE.isAdmin) return;
  const el = document.getElementById('admin-list-baotin');
  try {
    const data = await Api.get('getBaoTin', { password: STATE.adminPassword });
    STATE.cache.baoTin = data;
    document.getElementById('count-baotin').textContent = data.length + ' tin';
    refreshAccountNavDot();
    if (!data.length) { setEmpty(el, 'Chưa có báo tin nào.', 'favorite'); return; }
    el.innerHTML = data.map(function (item) {
      const done = item.DaXuLy === true || item.DaXuLy === 'TRUE';
      return '<div class="admin-list-item">' +
        '<div class="row-top"><span class="row-title">' + escapeHtml(item.NguoiCaoTuoi) + '</span>' +
          '<span class="badge ' + (done ? 'success' : 'danger') + '">' + (done ? 'Đã xử lý' : escapeHtml(item.LoaiTin)) + '</span></div>' +
        '<div class="row-meta">Người báo: ' + escapeHtml(item.NguoiBao) + ' — ' + escapeHtml(item.SoDienThoai) + ' • ' + formatDateTime(item.ThoiGian) + '</div>' +
        '<div class="row-body">' + escapeHtml(item.NoiDung) + '</div>' +
        '<div class="row-actions">' +
          (!done ? '<button class="btn success sm" data-done-bt="' + escapeHtml(item.ID) + '">Đánh dấu đã xử lý</button>' : '') +
          '<button class="btn danger sm" data-del-bt="' + escapeHtml(item.ID) + '">Xóa</button>' +
        '</div></div>';
    }).join('');
    el.querySelectorAll('[data-done-bt]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        try {
          await Api.post('markBaoTinProcessed', {}, { id: btn.dataset.doneBt, password: STATE.adminPassword });
          showToast('Đã đánh dấu xử lý.', 'success');
          loadBaoTinAdmin();
        } catch (err) { showToast(err.message, 'error'); }
      });
    });
    el.querySelectorAll('[data-del-bt]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        confirmPasswordThenRun('Xóa báo tin này?', async function (password) {
          await Api.post('deleteBaoTin', {}, { id: btn.dataset.delBt, password: password });
          showToast('Đã xóa báo tin.', 'success');
          loadBaoTinAdmin();
        });
      });
    });
  } catch (err) {
    setEmpty(el, err.message, 'error');
  }
}

// ---------------------------------------------------------------------------
// Quản lý Tài chính
// ---------------------------------------------------------------------------
function renderAdminTaiChinh(data) {
  const el = document.getElementById('admin-list-taichinh');
  const rows = data.danhSach || [];
  if (!rows.length) { setEmpty(el, 'Chưa có khoản thu/chi nào.', 'receipt_long'); return; }
  el.innerHTML = rows.slice().reverse().map(function (r) {
    return '<div class="admin-list-item">' +
      '<div class="row-top"><span class="row-title">' + escapeHtml(r.NoiDung) + '</span><span class="row-meta">' + formatDate(r.Ngay) + '</span></div>' +
      '<div class="row-body">Thu: ' + formatVND(r.Thu) + ' • Chi: ' + formatVND(r.Chi) + '</div>' +
      '<div class="row-actions">' +
        '<button class="btn outline sm" data-edit-tc="' + escapeHtml(r.ID) + '">Sửa</button>' +
        '<button class="btn danger sm" data-del-tc="' + escapeHtml(r.ID) + '">Xóa</button>' +
      '</div></div>';
  }).join('');
  el.querySelectorAll('[data-edit-tc]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = rows.find(function (i) { return String(i.ID) === btn.dataset.editTc; });
      openTaiChinhForm(item);
    });
  });
  el.querySelectorAll('[data-del-tc]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      confirmPasswordThenRun('Xóa khoản thu/chi này?', async function (password) {
        await Api.post('deleteTaiChinh', {}, { id: btn.dataset.delTc, password: password });
        showToast('Đã xóa.', 'success');
        loadTaiChinh();
      });
    });
  });
}

function openTaiChinhForm(item) {
  const isEdit = !!item;
  Modal.open(
    '<div class="modal-title">' + (isEdit ? 'Sửa khoản thu/chi' : 'Thêm khoản thu/chi') + '</div>' +
    '<div class="form-group"><label>Ngày</label><input class="form-control" type="date" id="tc-ngay" value="' + (isEdit ? new Date(item.Ngay).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)) + '"></div>' +
    '<div class="form-group"><label>Nội dung</label><input class="form-control" id="tc-noidung" value="' + (isEdit ? escapeHtml(item.NoiDung) : '') + '"></div>' +
    '<div class="form-group"><label>Số tiền thu (nếu có)</label><input class="form-control" type="number" id="tc-thu" value="' + (isEdit ? item.Thu : 0) + '"></div>' +
    '<div class="form-group"><label>Số tiền chi (nếu có)</label><input class="form-control" type="number" id="tc-chi" value="' + (isEdit ? item.Chi : 0) + '"></div>' +
    '<button class="btn primary" id="btn-save-taichinh">' + (isEdit ? 'Lưu thay đổi' : 'Thêm khoản') + '</button>'
  );
  document.getElementById('btn-save-taichinh').addEventListener('click', async function () {
    const payload = {
      Ngay: new Date(document.getElementById('tc-ngay').value).toISOString(),
      NoiDung: document.getElementById('tc-noidung').value.trim(),
      Thu: Number(document.getElementById('tc-thu').value) || 0,
      Chi: Number(document.getElementById('tc-chi').value) || 0
    };
    if (!payload.NoiDung) { showToast('Vui lòng nhập nội dung.', 'error'); return; }
    this.disabled = true;
    try {
      if (isEdit) {
        payload.ID = item.ID;
        await Api.post('updateTaiChinh', payload, { password: STATE.adminPassword });
      } else {
        await Api.post('addTaiChinh', payload, { password: STATE.adminPassword });
      }
      showToast('Đã lưu.', 'success');
      Modal.close();
      loadTaiChinh();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      this.disabled = false;
    }
  });
}

// ---------------------------------------------------------------------------
// Quản lý Quỹ ủng hộ
// ---------------------------------------------------------------------------
function renderAdminUngHo(data) {
  const el = document.getElementById('admin-list-unghoq');
  const rows = data.danhSach || [];
  if (!rows.length) { setEmpty(el, 'Chưa có người ủng hộ nào.', 'volunteer_activism'); return; }
  el.innerHTML = rows.map(function (r) {
    return '<div class="admin-list-item">' +
      '<div class="row-top"><span class="row-title">' + escapeHtml(r.NguoiUngHo) + '</span><span class="row-meta">' + formatDate(r.Ngay) + '</span></div>' +
      '<div class="row-body">' + formatVND(r.SoTien) + (r.NoiDung ? ' — ' + escapeHtml(r.NoiDung) : '') + '</div>' +
      '<div class="row-actions">' +
        '<button class="btn outline sm" data-edit-uh="' + escapeHtml(r.ID) + '">Sửa</button>' +
        '<button class="btn danger sm" data-del-uh="' + escapeHtml(r.ID) + '">Xóa</button>' +
      '</div></div>';
  }).join('');
  el.querySelectorAll('[data-edit-uh]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const item = rows.find(function (i) { return String(i.ID) === btn.dataset.editUh; });
      openUngHoForm(item);
    });
  });
  el.querySelectorAll('[data-del-uh]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      confirmPasswordThenRun('Xóa lượt ủng hộ này?', async function (password) {
        await Api.post('deleteUngHo', {}, { id: btn.dataset.delUh, password: password });
        showToast('Đã xóa.', 'success');
        loadUngHo();
      });
    });
  });
}

function openUngHoForm(item) {
  const isEdit = !!item;
  Modal.open(
    '<div class="modal-title">' + (isEdit ? 'Sửa lượt ủng hộ' : 'Thêm người ủng hộ') + '</div>' +
    '<div class="form-group"><label>Người ủng hộ</label><input class="form-control" id="uh-nguoi" value="' + (isEdit ? escapeHtml(item.NguoiUngHo) : '') + '"></div>' +
    '<div class="form-group"><label>Số tiền</label><input class="form-control" type="number" id="uh-sotien" value="' + (isEdit ? item.SoTien : '') + '"></div>' +
    '<div class="form-group"><label>Ngày</label><input class="form-control" type="date" id="uh-ngay" value="' + (isEdit ? new Date(item.Ngay).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)) + '"></div>' +
    '<div class="form-group"><label>Nội dung / Lời nhắn</label><input class="form-control" id="uh-noidung" value="' + (isEdit ? escapeHtml(item.NoiDung) : '') + '"></div>' +
    '<button class="btn primary" id="btn-save-unghoq">' + (isEdit ? 'Lưu thay đổi' : 'Thêm') + '</button>'
  );
  document.getElementById('btn-save-unghoq').addEventListener('click', async function () {
    const payload = {
      NguoiUngHo: document.getElementById('uh-nguoi').value.trim() || 'Ẩn danh',
      SoTien: Number(document.getElementById('uh-sotien').value) || 0,
      Ngay: new Date(document.getElementById('uh-ngay').value).toISOString(),
      NoiDung: document.getElementById('uh-noidung').value.trim()
    };
    this.disabled = true;
    try {
      if (isEdit) {
        payload.ID = item.ID;
        await Api.post('updateUngHo', payload, { password: STATE.adminPassword });
      } else {
        await Api.post('addUngHo', payload, { password: STATE.adminPassword });
      }
      showToast('Đã lưu.', 'success');
      Modal.close();
      loadUngHo();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      this.disabled = false;
    }
  });
}

// ---- Sửa thông tin chuyển khoản / QR (CauHinh) ----
function openCauHinhForm() {
  const cfg = STATE.cache.cauHinh || {};
  Modal.open(
    '<div class="modal-title">Thông tin chuyển khoản</div>' +
    '<div class="form-group"><label>Số tài khoản</label><input class="form-control" id="ch-stk" value="' + escapeHtml(cfg.SoTaiKhoan || '') + '"></div>' +
    '<div class="form-group"><label>Chủ tài khoản</label><input class="form-control" id="ch-chutk" value="' + escapeHtml(cfg.ChuTaiKhoan || '') + '"></div>' +
    '<div class="form-group"><label>Ngân hàng</label><input class="form-control" id="ch-nganhang" value="' + escapeHtml(cfg.NganHang || '') + '"></div>' +
    '<div class="form-group"><label>Nội dung chuyển khoản gợi ý</label><input class="form-control" id="ch-noidung" value="' + escapeHtml(cfg.NoiDungChuyenKhoan || '') + '"></div>' +
    '<div class="form-group"><label>Đường dẫn ảnh mã QR</label><input class="form-control" id="ch-qr" placeholder="https://..." value="' + escapeHtml(cfg.QRUrl || '') + '"></div>' +
    '<button class="btn primary" id="btn-save-cauhinh">Lưu thông tin</button>'
  );
  document.getElementById('btn-save-cauhinh').addEventListener('click', async function () {
    const payload = {
      SoTaiKhoan: document.getElementById('ch-stk').value.trim(),
      ChuTaiKhoan: document.getElementById('ch-chutk').value.trim(),
      NganHang: document.getElementById('ch-nganhang').value.trim(),
      NoiDungChuyenKhoan: document.getElementById('ch-noidung').value.trim(),
      QRUrl: document.getElementById('ch-qr').value.trim()
    };
    this.disabled = true;
    try {
      await Api.post('updateCauHinh', payload, { password: STATE.adminPassword });
      showToast('Đã cập nhật thông tin.', 'success');
      Modal.close();
      loadCauHinh();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      this.disabled = false;
    }
  });
}

// ============================================================================
// 16. XÁC NHẬN MẬT KHẨU TRƯỚC KHI XÓA (theo yêu cầu bảo mật)
// ============================================================================
function confirmPasswordThenRun(title, action) {
  Modal.open(
    '<div class="modal-title">' + escapeHtml(title) + '</div>' +
    '<p style="color:var(--color-text-muted);font-size:13.5px;margin-bottom:14px;">Vui lòng nhập lại mật khẩu quản trị để xác nhận thao tác này.</p>' +
    '<div class="form-group">' +
      '<div class="password-field">' +
        '<input class="form-control" type="password" id="confirm-del-password" placeholder="Mật khẩu quản trị">' +
        '<button type="button" class="password-toggle" data-toggle-for="confirm-del-password"><span class="material-symbols-rounded">visibility</span></button>' +
      '</div>' +
    '</div>' +
    '<div class="btn-row">' +
      '<button class="btn outline" id="btn-cancel-del">Hủy</button>' +
      '<button class="btn danger" id="btn-confirm-del">Xác nhận xóa</button>' +
    '</div>'
  );
  bindPasswordToggles();
  document.getElementById('btn-cancel-del').addEventListener('click', Modal.close);
  document.getElementById('btn-confirm-del').addEventListener('click', async function () {
    const password = document.getElementById('confirm-del-password').value;
    if (!password) { showToast('Vui lòng nhập mật khẩu.', 'error'); return; }
    this.disabled = true;
    try {
      await action(password);
      Modal.close();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      this.disabled = false;
    }
  });
}
