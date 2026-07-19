// ============ STATE ============
let VAI_TRO = null;
let ADMIN_PASS = null;
let TAB_HIEN_TAI = 'home';

// ============ GỌI API APPS SCRIPT ============
async function goiApi(action, params) {
  params = params || {};
  const url = new URL(APPS_SCRIPT_URL);
  url.searchParams.set('action', action);
  Object.keys(params).forEach(k => {
    if (params[k] !== undefined && params[k] !== null) url.searchParams.set(k, params[k]);
  });
  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (err) {
    hienToast('Lỗi kết nối máy chủ: ' + err.message);
    return { success: false, message: 'Lỗi kết nối máy chủ.' };
  }
}

// ============ TIỆN ÍCH ============
function hienToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.style.display = 'none', 2600);
}

function dinhDangNgay(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function chuCaiDau(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts[parts.length - 1][0].toUpperCase();
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function dongModal() {
  document.getElementById('modalOverlay').style.display = 'none';
  document.getElementById('modalOverlay').innerHTML = '';
}
function moModal(html) {
  const ov = document.getElementById('modalOverlay');
  ov.innerHTML = html;
  ov.style.display = 'flex';
}

// ============ CHỌN VAI TRÒ ============
function chonVaiTro(role) {
  VAI_TRO = role;
  document.getElementById('roleScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';
  document.getElementById('bottomNav').style.display = 'flex';
  renderBottomNav();
  chuyenTab('home');
}

function moDangNhapAdmin() {
  moModal(`
    <div class="modal-box">
      <h3>🛡️ Đăng nhập quản trị</h3>
      <div class="modal-sub">Nhập mật khẩu quản trị viên để tiếp tục</div>
      <input type="password" id="inpAdminPass" placeholder="Mật khẩu">
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="dongModal()">Huỷ</button>
        <button class="btn btn-primary" onclick="thucHienDangNhapAdmin()">Đăng nhập</button>
      </div>
    </div>
  `);
}

async function thucHienDangNhapAdmin() {
  const pass = document.getElementById('inpAdminPass').value;
  if (!pass) { hienToast('Vui lòng nhập mật khẩu'); return; }
  const res = await goiApi('verifyAdminPassword', { password: pass });
  if (res.success && res.valid) {
    ADMIN_PASS = pass;
    dongModal();
    chonVaiTro('admin');
  } else {
    hienToast('Sai mật khẩu quản trị');
  }
}

function dangXuat() {
  VAI_TRO = null;
  ADMIN_PASS = null;
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('bottomNav').style.display = 'none';
  document.getElementById('roleScreen').style.display = 'flex';
}

// ============ ĐIỀU HƯỚNG ============
function renderBottomNav() {
  const nav = document.getElementById('bottomNav');
  let items;
  if (VAI_TRO === 'thanhvien') {
    items = [
      { key: 'home', emoji: '🏠', label: 'Trang chủ' },
      { key: 'thongbao', emoji: '📢', label: 'Thông báo' },
      { key: 'chihoi', emoji: '👥', label: 'Chi hội' },
      { key: 'ykien', emoji: '💬', label: 'Ý kiến' }
    ];
  } else {
    items = [
      { key: 'home', emoji: '🏠', label: 'Trang chủ' },
      { key: 'admin_taotb', emoji: '📝', label: 'Tạo tin' },
      { key: 'admin_ykien', emoji: '📥', label: 'Tin nhận' },
      { key: 'admin_caidat', emoji: '⚙️', label: 'Cài đặt' }
    ];
  }
  nav.innerHTML = items.map(it => `
    <div class="nav-item ${TAB_HIEN_TAI === it.key ? 'active' : ''}" onclick="chuyenTab('${it.key}')">
      <span class="nav-emoji">${it.emoji}</span>${it.label}
    </div>
  `).join('');
}

function chuyenTab(tab) {
  TAB_HIEN_TAI = tab;
  renderBottomNav();
  if (VAI_TRO === 'thanhvien') {
    if (tab === 'home') renderHomeThanhVien();
    else if (tab === 'thongbao') renderThongBaoTab();
    else if (tab === 'chihoi') renderChiHoiTab();
    else if (tab === 'ykien') renderYKienForm();
  } else {
    if (tab === 'home') renderHomeAdmin();
    else if (tab === 'admin_taotb') renderAdminTaoThongBao();
    else if (tab === 'admin_ykien') renderAdminYKien();
    else if (tab === 'admin_caidat') renderAdminCaiDat();
  }
}

function setHeader(title, sub) {
  document.getElementById('headerTitle').textContent = title;
  document.getElementById('headerSub').textContent = sub || 'Chăm sóc người cao tuổi';
}

// ============ TRANG CHỦ - THÀNH VIÊN ============
async function renderHomeThanhVien() {
  setHeader('🌿 Trang chủ', 'Xin chào, chúc quý vị sức khoẻ!');
  document.getElementById('content').innerHTML = `
    <div class="home-grid">
      <div class="home-tile amber" onclick="chuyenTab('thongbao')"><span class="emoji">📢</span><div class="label">Thông báo</div></div>
      <div class="home-tile teal" onclick="chuyenTab('chihoi')"><span class="emoji">👥</span><div class="label">Thành viên chi hội</div></div>
      <div class="home-tile blue" onclick="chuyenTab('ykien')"><span class="emoji">💬</span><div class="label">Ý kiến, báo tin</div></div>
      <div class="home-tile gray" onclick="chuyenTab('thongbao')"><span class="emoji">📌</span><div class="label">Tin ghim mới</div></div>
    </div>
    <div class="section-title">📢 Thông báo gần đây</div>
    <div id="homeThongBaoPreview" class="spinner">Đang tải...</div>
  `;
  const res = await goiApi('getThongBao');
  const el = document.getElementById('homeThongBaoPreview');
  if (!el) return;
  const list = res.success ? res.data : [];
  if (!list.length) { el.innerHTML = emptyState('📭', 'Chưa có thông báo nào'); return; }
  el.innerHTML = list.slice(0, 3).map(tb => renderNoticeCard(tb, false)).join('');
}

function emptyState(emoji, text) {
  return `<div class="empty-state"><span class="emoji">${emoji}</span>${text}</div>`;
}

// ============ THÔNG BÁO (accordion - chạm để xổ ra) ============
function renderNoticeCard(tb, choPhepXoa) {
  const pinned = tb.loaiTin === 'ghim';
  return `
    <div class="notice-item ${pinned ? 'pinned' : ''}" onclick="toggleCard(this)">
      <div class="notice-head">
        <div>
          ${pinned ? `<div class="pin-badge">📌 TIN GHIM</div>` : ''}
          <h3>${escapeHtml(tb.tieuDe)}</h3>
        </div>
        <span class="chevron">▾</span>
      </div>
      <div class="notice-body">
        <p>${escapeHtml(tb.noiDung)}</p>
        <div class="meta">
          <span>🕒 ${dinhDangNgay(tb.ngayTao)}</span>
          ${choPhepXoa ? `<button class="del-btn" onclick="event.stopPropagation(); xacNhanXoaThongBao('${tb.id}')">Xoá</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

function toggleCard(el) {
  el.classList.toggle('expanded');
}

async function renderThongBaoTab() {
  setHeader('📢 Thông báo', 'Chạm vào từng tin để xem chi tiết');
  document.getElementById('content').innerHTML = `<div id="dsThongBao" class="spinner">Đang tải...</div>`;
  const res = await goiApi('getThongBao');
  const el = document.getElementById('dsThongBao');
  if (!el) return;
  const list = res.success ? res.data : [];
  if (!list.length) { el.innerHTML = emptyState('📭', 'Chưa có thông báo nào'); return; }
  el.innerHTML = list.map(tb => renderNoticeCard(tb, VAI_TRO === 'admin')).join('');
}

function xacNhanXoaThongBao(id) {
  moModal(`
    <div class="modal-box">
      <h3>🗑️ Xoá thông báo</h3>
      <div class="modal-sub">Nhập lại mật khẩu quản trị để xác nhận xoá. Thao tác này không thể hoàn tác.</div>
      <input type="password" id="inpXoaPass" placeholder="Mật khẩu quản trị">
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="dongModal()">Huỷ</button>
        <button class="btn btn-danger" onclick="thucHienXoaThongBao('${id}')">Xoá</button>
      </div>
    </div>
  `);
}

async function thucHienXoaThongBao(id) {
  const pass = document.getElementById('inpXoaPass').value;
  if (!pass) { hienToast('Vui lòng nhập mật khẩu'); return; }
  const res = await goiApi('deleteThongBao', { password: pass, id });
  dongModal();
  hienToast(res.message);
  if (res.success) {
    if (TAB_HIEN_TAI === 'admin_taotb') taiLaiDsThongBaoAdmin();
    else renderThongBaoTab();
  }
}

// ============ CHI HỘI (dữ liệu từ chihoi.js) ============
function renderChiHoiTab() {
  setHeader('👥 Thành viên chi hội', `${DANH_SACH_CHI_HOI.length} thành viên`);
  document.getElementById('content').innerHTML = `
    <input type="text" id="timKiemThanhVien" class="member-search" placeholder="🔍 Tìm theo tên, tổ, số điện thoại...">
    <div class="member-count">Tổng số: <b>${DANH_SACH_CHI_HOI.length}</b> / tối đa 300 thành viên</div>
    <div class="card" id="dsThanhVien"></div>
  `;
  veDsThanhVien(DANH_SACH_CHI_HOI);
  document.getElementById('timKiemThanhVien').addEventListener('input', function (e) {
    const q = e.target.value.trim().toLowerCase();
    const loc = DANH_SACH_CHI_HOI.filter(tv =>
      (tv.hoTen || '').toLowerCase().includes(q) ||
      (tv.diaChi || '').toLowerCase().includes(q) ||
      (tv.sdt || '').includes(q)
    );
    veDsThanhVien(loc);
  });
}

function veDsThanhVien(list) {
  const el = document.getElementById('dsThanhVien');
  if (!list.length) { el.innerHTML = emptyState('🔎', 'Không tìm thấy thành viên'); return; }
  el.innerHTML = list.map(tv => `
    <div class="member-row">
      <div class="member-avatar">${chuCaiDau(tv.hoTen)}</div>
      <div class="member-info">
        <div class="name">${escapeHtml(tv.hoTen)} ${tv.namSinh ? `(${tv.namSinh})` : ''}</div>
        <div class="sub">${escapeHtml(tv.diaChi || '')} ${tv.sdt ? '· ' + escapeHtml(tv.sdt) : ''}</div>
        ${tv.ghiChu ? `<div class="sub">🏷️ ${escapeHtml(tv.ghiChu)}</div>` : ''}
      </div>
    </div>
  `).join('');
}

// ============ Ý KIẾN / BÁO TIN - FORM THÀNH VIÊN ============
function renderYKienForm() {
  setHeader('💬 Ý kiến, báo tin', 'Gửi góp ý hoặc báo tình hình sức khoẻ');
  document.getElementById('content').innerHTML = `
    <div class="card">
      <label>Loại thông tin</label>
      <div class="radio-group" id="loaiYKienGroup">
        <div class="radio-chip active" data-val="Ý kiến/Góp ý" onclick="chonLoaiYKien(this)">💬 Góp ý</div>
        <div class="radio-chip" data-val="Báo ốm" onclick="chonLoaiYKien(this)">🤒 Báo ốm</div>
        <div class="radio-chip" data-val="Báo qua đời" onclick="chonLoaiYKien(this)">🕯️ Báo qua đời</div>
      </div>
      <label>Họ và tên người báo <span style="color:var(--red)">*</span></label>
      <input type="text" id="ykHoTen" placeholder="Nhập họ và tên">
      <label>Số điện thoại <span style="color:var(--red)">*</span></label>
      <input type="tel" id="ykSdt" placeholder="Nhập số điện thoại liên hệ">
      <label>Nội dung <span style="color:var(--red)">*</span></label>
      <textarea id="ykNoiDung" placeholder="Mô tả nội dung góp ý hoặc tình hình sức khoẻ..."></textarea>
      <button class="btn btn-primary" onclick="guiYKien()">📨 Gửi thông tin</button>
    </div>
  `;
}

function chonLoaiYKien(el) {
  document.querySelectorAll('#loaiYKienGroup .radio-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

async function guiYKien() {
  const hoTen = document.getElementById('ykHoTen').value.trim();
  const sdt = document.getElementById('ykSdt').value.trim();
  const noiDung = document.getElementById('ykNoiDung').value.trim();
  const loai = document.querySelector('#loaiYKienGroup .radio-chip.active').dataset.val;
  if (!hoTen || !sdt || !noiDung) { hienToast('Vui lòng nhập đầy đủ thông tin'); return; }
  const res = await goiApi('submitYKien', { hoTen, sdt, loai, noiDung });
  hienToast(res.message);
  if (res.success) renderYKienForm();
}

// ============ TRANG CHỦ - ADMIN ============
async function renderHomeAdmin() {
  setHeader('🛡️ Trang quản trị', 'Quản lý thông báo & tin nhận');
  document.getElementById('content').innerHTML = `
    <div class="home-grid">
      <div class="home-tile amber" onclick="chuyenTab('admin_taotb')"><span class="emoji">📝</span><div class="label">Tạo thông báo</div></div>
      <div class="home-tile blue" onclick="chuyenTab('admin_ykien')"><span class="emoji">📥</span><div class="label">Ý kiến & tin báo</div></div>
      <div class="home-tile teal" onclick="chuyenTab('chihoi')"><span class="emoji">👥</span><div class="label">Thành viên chi hội</div></div>
      <div class="home-tile gray" onclick="chuyenTab('admin_caidat')"><span class="emoji">⚙️</span><div class="label">Cài đặt</div></div>
    </div>
    <div class="section-title">📢 Thông báo hiện có</div>
    <div id="homeThongBaoPreview" class="spinner">Đang tải...</div>
  `;
  const res = await goiApi('getThongBao');
  const el = document.getElementById('homeThongBaoPreview');
  if (!el) return;
  const list = res.success ? res.data : [];
  if (!list.length) { el.innerHTML = emptyState('📭', 'Chưa có thông báo nào'); return; }
  el.innerHTML = list.slice(0, 3).map(tb => renderNoticeCard(tb, true)).join('');
}

// ============ ADMIN: TẠO THÔNG BÁO ============
function renderAdminTaoThongBao() {
  setHeader('📝 Tạo thông báo', 'Đăng tin mới cho toàn chi hội');
  document.getElementById('content').innerHTML = `
    <div class="card">
      <label>Loại tin</label>
      <div class="radio-group" id="loaiTinGroup">
        <div class="radio-chip active" data-val="thuong" onclick="chonLoaiTin(this)">📰 Tin thường</div>
        <div class="radio-chip" data-val="ghim" onclick="chonLoaiTin(this)">📌 Tin ghim</div>
      </div>
      <label>Tiêu đề <span style="color:var(--red)">*</span></label>
      <input type="text" id="tbTieuDe" placeholder="Nhập tiêu đề thông báo">
      <label>Nội dung <span style="color:var(--red)">*</span></label>
      <textarea id="tbNoiDung" placeholder="Nhập nội dung thông báo..."></textarea>
      <button class="btn btn-primary" onclick="dangThongBao()">📢 Đăng thông báo</button>
    </div>
    <div class="section-title">Danh sách thông báo đã đăng</div>
    <div id="dsThongBaoAdmin" class="spinner">Đang tải...</div>
  `;
  taiLaiDsThongBaoAdmin();
}

async function taiLaiDsThongBaoAdmin() {
  const res = await goiApi('getThongBao');
  const el = document.getElementById('dsThongBaoAdmin');
  if (!el) return;
  const list = res.success ? res.data : [];
  if (!list.length) { el.innerHTML = emptyState('📭', 'Chưa có thông báo nào'); return; }
  el.innerHTML = list.map(tb => renderNoticeCard(tb, true)).join('');
}

function chonLoaiTin(el) {
  document.querySelectorAll('#loaiTinGroup .radio-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

async function dangThongBao() {
  const tieuDe = document.getElementById('tbTieuDe').value.trim();
  const noiDung = document.getElementById('tbNoiDung').value.trim();
  const loaiTin = document.querySelector('#loaiTinGroup .radio-chip.active').dataset.val;
  if (!tieuDe || !noiDung) { hienToast('Vui lòng nhập đầy đủ tiêu đề và nội dung'); return; }
  const res = await goiApi('createThongBao', { password: ADMIN_PASS, tieuDe, noiDung, loaiTin });
  hienToast(res.message);
  if (res.success) {
    document.getElementById('tbTieuDe').value = '';
    document.getElementById('tbNoiDung').value = '';
    taiLaiDsThongBaoAdmin();
  }
}

// ============ ADMIN: XEM Ý KIẾN / TIN BÁO (accordion) ============
async function renderAdminYKien() {
  setHeader('📥 Ý kiến & tin báo', 'Chạm vào từng mục để xem chi tiết');
  document.getElementById('content').innerHTML = `<div id="dsYKienAdmin" class="spinner">Đang tải...</div>`;
  const res = await goiApi('getYKien', { password: ADMIN_PASS });
  const el = document.getElementById('dsYKienAdmin');
  if (!el) return;
  if (!res.success) { hienToast(res.message); el.innerHTML = ''; return; }
  if (!res.data.length) { el.innerHTML = emptyState('📭', 'Chưa có ý kiến hoặc tin báo nào'); return; }
  el.innerHTML = res.data.map(yk => renderYKienCard(yk)).join('');
}

function nhanDienMauLoai(loai) {
  if (loai === 'Báo ốm') return { emoji: '🤒', mau: 'var(--amber)' };
  if (loai === 'Báo qua đời') return { emoji: '🕯️', mau: 'var(--red)' };
  return { emoji: '💬', mau: 'var(--blue-600)' };
}

function renderYKienCard(yk) {
  const m = nhanDienMauLoai(yk.loai);
  return `
    <div class="notice-item" onclick="toggleCard(this)">
      <div class="notice-head">
        <div>
          <div class="pin-badge" style="color:${m.mau}; background:#eef6ff;">${m.emoji} ${escapeHtml(yk.loai)}</div>
          <h3>${escapeHtml(yk.hoTen)} <span style="font-weight:400;font-size:12.5px;color:var(--gray-500)">· ${escapeHtml(yk.sdt)}</span></h3>
        </div>
        <span class="chevron">▾</span>
      </div>
      <div class="notice-body">
        <p>${escapeHtml(yk.noiDung)}</p>
        <div class="meta">
          <span>🕒 ${dinhDangNgay(yk.ngayGui)}</span>
          <button class="del-btn" onclick="event.stopPropagation(); xacNhanXoaYKien('${yk.id}')">Xoá</button>
        </div>
      </div>
    </div>
  `;
}

function xacNhanXoaYKien(id) {
  moModal(`
    <div class="modal-box">
      <h3>🗑️ Xoá thông tin</h3>
      <div class="modal-sub">Nhập lại mật khẩu quản trị để xác nhận xoá. Thao tác này không thể hoàn tác.</div>
      <input type="password" id="inpXoaPass2" placeholder="Mật khẩu quản trị">
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="dongModal()">Huỷ</button>
        <button class="btn btn-danger" onclick="thucHienXoaYKien('${id}')">Xoá</button>
      </div>
    </div>
  `);
}

async function thucHienXoaYKien(id) {
  const pass = document.getElementById('inpXoaPass2').value;
  if (!pass) { hienToast('Vui lòng nhập mật khẩu'); return; }
  const res = await goiApi('deleteYKien', { password: pass, id });
  dongModal();
  hienToast(res.message);
  if (res.success) renderAdminYKien();
}

// ============ ADMIN: CÀI ĐẶT (ĐỔI MẬT KHẨU) ============
function renderAdminCaiDat() {
  setHeader('⚙️ Cài đặt', 'Đổi mật khẩu quản trị');
  document.getElementById('content').innerHTML = `
    <div class="card">
      <label>Mật khẩu hiện tại</label>
      <input type="password" id="matKhauCu" placeholder="Mật khẩu hiện tại">
      <label>Mật khẩu mới</label>
      <input type="password" id="matKhauMoi" placeholder="Mật khẩu mới (ít nhất 4 ký tự)">
      <label>Nhập lại mật khẩu mới</label>
      <input type="password" id="matKhauMoiLai" placeholder="Nhập lại mật khẩu mới">
      <button class="btn btn-primary" onclick="doiMatKhau()">🔒 Đổi mật khẩu</button>
    </div>
  `;
}

async function doiMatKhau() {
  const cu = document.getElementById('matKhauCu').value;
  const moi = document.getElementById('matKhauMoi').value;
  const moiLai = document.getElementById('matKhauMoiLai').value;
  if (!cu || !moi || !moiLai) { hienToast('Vui lòng nhập đầy đủ'); return; }
  if (moi !== moiLai) { hienToast('Mật khẩu mới nhập lại không khớp'); return; }
  const res = await goiApi('changeAdminPassword', { oldPassword: cu, newPassword: moi });
  hienToast(res.message);
  if (res.success) { ADMIN_PASS = moi; renderAdminCaiDat(); }
}
