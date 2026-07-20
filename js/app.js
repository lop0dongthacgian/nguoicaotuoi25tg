// ============================================
// Main Application Logic
// ============================================

class App {
    constructor() {
        this.currentUser = null;
        this.currentSection = null;
        this.isAdmin = false;
        
        this.init();
    }
    
    // ============================================
    // Initialization
    // ============================================
    async init() {
        // Show splash screen
        this.showSplash();
        
        // Load settings
        this.loadSettings();
        
        // Simulate loading
        await this.delay(2000);
        
        // Hide splash and show app
        this.hideSplash();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check if user is already logged in
        this.checkLoginStatus();
    }
    
    loadSettings() {
        // Load dark mode
        const darkMode = localStorage.getItem(CONFIG.STORAGE_KEYS.DARK_MODE);
        if (darkMode === 'true') {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.getElementById('darkModeIcon').textContent = 'light_mode';
        }
    }
    
    setupEventListeners() {
        // Back button
        document.getElementById('backButton').addEventListener('click', () => this.goBack());
        
        // Dark mode toggle
        document.getElementById('darkModeIcon').parentElement.addEventListener('click', () => this.toggleDarkMode());
    }
    
    // ============================================
    // Splash Screen
    // ============================================
    showSplash() {
        document.getElementById('splashScreen').style.display = 'flex';
        document.getElementById('app').style.display = 'none';
    }
    
    hideSplash() {
        const splash = document.getElementById('splashScreen');
        splash.style.opacity = '0';
        splash.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            splash.style.display = 'none';
            document.getElementById('app').style.display = 'block';
        }, 500);
    }
    
    // ============================================
    // Authentication
    // ============================================
    checkLoginStatus() {
        const userRole = sessionStorage.getItem(CONFIG.STORAGE_KEYS.USER_ROLE);
        if (userRole === 'admin') {
            this.loginSuccess('admin');
        } else if (userRole === 'member') {
            this.loginSuccess('member');
        } else {
            this.showScreen('loginScreen');
        }
    }
    
    loginAsMember() {
        this.loginSuccess('member');
    }
    
    async loginAsAdmin() {
        const password = document.getElementById('adminPassword').value;
        
        if (!password) {
            this.showToast('Vui lòng nhập mật khẩu', 'warning');
            return;
        }
        
        this.showLoading();
        
        try {
            const result = await this.callAPI('loginAdmin', { password });
            
            if (result.success) {
                this.loginSuccess('admin');
                this.showToast('Đăng nhập thành công!', 'success');
            } else {
                this.showToast('Mật khẩu không đúng!', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            // Fallback: Check with default password
            if (password === CONFIG.DEFAULT_ADMIN_PASSWORD) {
                this.loginSuccess('admin');
                this.showToast('Đăng nhập thành công!', 'success');
            } else {
                this.showToast('Lỗi kết nối! Vui lòng thử lại.', 'error');
            }
        } finally {
            this.hideLoading();
        }
    }
    
    loginSuccess(role) {
        this.currentUser = role;
        this.isAdmin = role === 'admin';
        sessionStorage.setItem(CONFIG.STORAGE_KEYS.USER_ROLE, role);
        
        // Update UI
        document.getElementById('logoutButton').style.display = 'flex';
        
        if (this.isAdmin) {
            document.getElementById('adminNavButton').style.display = 'block';
        }
        
        // Show home screen
        this.showHome();
    }
    
    logout() {
        sessionStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ROLE);
        this.currentUser = null;
        this.isAdmin = false;
        
        document.getElementById('logoutButton').style.display = 'none';
        document.getElementById('adminNavButton').style.display = 'none';
        
        this.showScreen('loginScreen');
        document.getElementById('adminPassword').value = '';
        
        this.showToast('Đã đăng xuất!', 'success');
    }
    
    // ============================================
    // Navigation
    // ============================================
    showScreen(screenId) {
        // Hide all screens
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));
        
        // Show target screen
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.add('active');
        }
        
        // Update back button
        if (screenId === 'loginScreen' || screenId === 'homeScreen') {
            document.getElementById('backButton').style.display = 'none';
        } else {
            document.getElementById('backButton').style.display = 'flex';
        }
        
        // Hide sections container
        document.getElementById('sectionsContainer').style.display = 'none';
        document.getElementById('sectionsContainer').innerHTML = '';
    }
    
    showHome() {
        this.showScreen('homeScreen');
        this.updateNav('home');
    }
    
    navigateTo(page) {
        if (page === 'home') {
            this.showHome();
        } else if (page === 'admin') {
            if (this.isAdmin) {
                this.showAdminDashboard();
            } else {
                this.showToast('Bạn không có quyền truy cập!', 'error');
            }
        }
        this.updateNav(page);
    }
    
    updateNav(page) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
        });
        
        if (page === 'home') {
            navItems[0].classList.add('active');
        } else if (page === 'admin') {
            navItems[1]?.classList.add('active');
        }
    }
    
    goBack() {
        const sectionsContainer = document.getElementById('sectionsContainer');
        
        if (sectionsContainer.style.display !== 'none') {
            sectionsContainer.style.display = 'none';
            sectionsContainer.innerHTML = '';
            this.showHome();
        } else {
            this.showHome();
        }
    }
    
    // ============================================
    // Sections
    // ============================================
    showSection(section) {
        this.currentSection = section;
        const container = document.getElementById('sectionsContainer');
        container.style.display = 'block';
        
        switch(section) {
            case 'thongbao':
                container.innerHTML = this.getThongBaoHTML();
                this.loadThongBao();
                break;
            case 'thanhvien':
                container.innerHTML = this.getThanhVienHTML();
                this.loadThanhVien();
                break;
            case 'gopy':
                container.innerHTML = this.getGopYHTML();
                break;
            case 'baotin':
                container.innerHTML = this.getBaoTinHTML();
                break;
            case 'ungho':
                container.innerHTML = this.getUngHoHTML();
                this.loadUngHoStats();
                break;
            case 'taichinh':
                container.innerHTML = this.getTaiChinhHTML();
                this.loadTaiChinh();
                break;
        }
        
        document.getElementById('backButton').style.display = 'flex';
        this.updateNav(null);
    }
    
    // ============================================
    // Admin Dashboard
    // ============================================
    showAdminDashboard() {
        const container = document.getElementById('sectionsContainer');
        container.style.display = 'block';
        
        container.innerHTML = `
            <div class="admin-dashboard">
                <h2 style="margin-bottom: 20px; color: var(--text-primary);">
                    <span class="material-icons" style="vertical-align: middle;">dashboard</span>
                    Quản trị hệ thống
                </h2>
                
                <div class="admin-menu">
                    <div class="admin-card" onclick="app.showAdminSection('createThongBao')">
                        <span class="material-icons">campaign</span>
                        <h3>Tạo thông báo</h3>
                    </div>
                    <div class="admin-card" onclick="app.showAdminSection('manageGopY')">
                        <span class="material-icons">forum</span>
                        <h3>Quản lý góp ý</h3>
                    </div>
                    <div class="admin-card" onclick="app.showAdminSection('manageBaoTin')">
                        <span class="material-icons">favorite</span>
                        <h3>Quản lý báo tin</h3>
                    </div>
                    <div class="admin-card" onclick="app.showAdminSection('manageTaiChinh')">
                        <span class="material-icons">account_balance_wallet</span>
                        <h3>Quản lý tài chính</h3>
                    </div>
                    <div class="admin-card" onclick="app.showAdminSection('manageUngHo')">
                        <span class="material-icons">volunteer_activism</span>
                        <h3>Quản lý quỹ ủng hộ</h3>
                    </div>
                    <div class="admin-card" onclick="app.showChangePasswordForm()">
                        <span class="material-icons">lock</span>
                        <h3>Đổi mật khẩu</h3>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('backButton').style.display = 'flex';
        this.updateNav('admin');
    }
    
    showAdminSection(section) {
        const container = document.getElementById('sectionsContainer');
        
        switch(section) {
            case 'createThongBao':
                container.innerHTML = this.getCreateThongBaoHTML();
                break;
            case 'manageGopY':
                container.innerHTML = this.getManageGopYHTML();
                this.loadGopYList();
                break;
            case 'manageBaoTin':
                container.innerHTML = this.getManageBaoTinHTML();
                this.loadBaoTinList();
                break;
            case 'manageTaiChinh':
                container.innerHTML = this.getManageTaiChinhHTML();
                this.loadTaiChinhManagement();
                break;
            case 'manageUngHo':
                container.innerHTML = this.getManageUngHoHTML();
                this.loadUngHoManagement();
                break;
        }
    }
    
    // ============================================
    // HTML Templates
    // ============================================
    getThongBaoHTML() {
        return `
            <div class="section-header">
                <h2><span class="material-icons">campaign</span> Thông báo</h2>
            </div>
            <div id="thongBaoList" class="thongbao-list">
                <div class="loading-spinner"></div>
                <p style="text-align: center; color: var(--text-secondary);">Đang tải thông báo...</p>
            </div>
        `;
    }
    
    getThanhVienHTML() {
        return `
            <div class="section-header">
                <h2><span class="material-icons">groups</span> Thành viên Chi hội</h2>
            </div>
            <div class="search-box">
                <span class="material-icons">search</span>
                <input type="text" class="search-input" id="memberSearch" placeholder="Tìm theo tên..." onkeyup="app.searchMembers()">
            </div>
            <div class="member-actions">
                <button class="btn btn-primary" onclick="app.showAllMembers()">
                    <span class="material-icons">list</span>
                    Xem tất cả
                </button>
            </div>
            <div id="memberList" class="member-list">
                <p style="text-align: center; color: var(--text-secondary);">
                    Nhập tên để tìm kiếm hoặc nhấn "Xem tất cả"
                </p>
            </div>
        `;
    }
    
    getGopYHTML() {
        return `
            <div class="section-header">
                <h2><span class="material-icons">forum</span> Gửi ý kiến</h2>
            </div>
            <div class="card">
                <form onsubmit="app.submitGopY(event)">
                    <div class="form-group">
                        <label>Họ tên người gửi <span style="color: var(--danger);">*</span></label>
                        <input type="text" class="form-control" id="gopYHoTen" required placeholder="Nhập họ tên">
                    </div>
                    <div class="form-group">
                        <label>Số điện thoại <span style="color: var(--danger);">*</span></label>
                        <input type="tel" class="form-control" id="gopYDienThoai" required placeholder="Nhập số điện thoại">
                    </div>
                    <div class="form-group">
                        <label>Nội dung ý kiến <span style="color: var(--danger);">*</span></label>
                        <textarea class="form-control" id="gopYNoiDung" required placeholder="Nhập nội dung ý kiến..."></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">
                        <span class="material-icons">send</span>
                        Gửi ý kiến
                    </button>
                </form>
            </div>
        `;
    }
    
    getBaoTinHTML() {
        return `
            <div class="section-header">
                <h2><span class="material-icons">favorite</span> Báo tin sức khỏe</h2>
            </div>
            <div class="card">
                <form onsubmit="app.submitBaoTin(event)">
                    <div class="form-group">
                        <label>Họ tên người báo <span style="color: var(--danger);">*</span></label>
                        <input type="text" class="form-control" id="baoTinNguoiBao" required placeholder="Nhập họ tên">
                    </div>
                    <div class="form-group">
                        <label>Số điện thoại <span style="color: var(--danger);">*</span></label>
                        <input type="tel" class="form-control" id="baoTinDienThoai" required placeholder="Nhập số điện thoại">
                    </div>
                    <div class="form-group">
                        <label>Họ tên người cao tuổi <span style="color: var(--danger);">*</span></label>
                        <input type="text" class="form-control" id="baoTinNCT" required placeholder="Nhập họ tên người cao tuổi">
                    </div>
                    <div class="form-group">
                        <label>Nội dung <span style="color: var(--danger);">*</span></label>
                        <select class="form-control" id="baoTinNoiDung" required>
                            <option value="">-- Chọn nội dung --</option>
                            <option value="Đau ốm">Đau ốm</option>
                            <option value="Nhập viện">Nhập viện</option>
                            <option value="Qua đời">Qua đời</option>
                            <option value="Hoàn cảnh khó khăn">Hoàn cảnh khó khăn</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">
                        <span class="material-icons">send</span>
                        Gửi báo tin
                    </button>
                </form>
            </div>
        `;
    }
    
    getUngHoHTML() {
        return `
            <div class="section-header">
                <h2><span class="material-icons">volunteer_activism</span> Ủng hộ Quỹ</h2>
            </div>
            <div class="card">
                <h3 style="color: var(--primary);">Thông tin tài khoản</h3>
                <div style="margin: 16px 0;">
                    <p><strong>Số tài khoản:</strong> 1234567890</p>
                    <p><strong>Chủ tài khoản:</strong> CHI HOI NGUOI CAO TUOI</p>
                    <p><strong>Ngân hàng:</strong> Vietcombank - Chi nhánh XYZ</p>
                    <p><strong>Nội dung CK:</strong> Ho ten - Ung ho quy Cham soc NCT</p>
                </div>
                <div class="qr-container">
                    <h4>Quét mã QR để chuyển khoản</h4>
                    <div class="qr-code" id="qrcode"></div>
                </div>
            </div>
            <div class="card" style="background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: white;">
                <h3>Thống kê quỹ ủng hộ</h3>
                <div id="unghoStats">
                    <p style="font-size: 24px; font-weight: bold; margin: 16px 0;">
                        Tổng: <span id="totalUngHo">0</span> VNĐ
                    </p>
                </div>
            </div>
        `;
    }
    
    getTaiChinhHTML() {
        return `
            <div class="section-header">
                <h2><span class="material-icons">account_balance_wallet</span> Công khai tài chính</h2>
            </div>
            <div class="card">
                <div class="table-container">
                    <table id="taiChinhTable">
                        <thead>
                            <tr>
                                <th>Ngày</th>
                                <th>Nội dung</th>
                                <th>Thu</th>
                                <th>Chi</th>
                                <th>Số dư</th>
                            </tr>
                        </thead>
                        <tbody id="taiChinhBody">
                            <tr>
                                <td colspan="5" style="text-align: center;">Đang tải...</td>
                            </tr>
                        </tbody>
                        <tfoot id="taiChinhFooter"></tfoot>
                    </table>
                </div>
            </div>
        `;
    }
    
    // ============================================
    // API Calls
    // ============================================
    async callAPI(action, data = {}) {
        try {
            const formData = new FormData();
            formData.append('action', action);
            
            for (const key in data) {
                formData.append(key, data[key]);
            }
            
            const response = await fetch(CONFIG.SCRIPT_URL, {
                method: 'POST',
                body: formData
            });
            
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // ============================================
    // Data Loading
    // ============================================
    async loadThongBao() {
        try {
            const result = await this.callAPI('getThongBao');
            if (result.success) {
                this.renderThongBao(result.data);
            }
        } catch (error) {
            console.error('Load thong bao error:', error);
            // Load mock data
            this.renderThongBao([]);
        }
    }
    
    renderThongBao(data) {
        const container = document.getElementById('thongBaoList');
        
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Chưa có thông báo nào</p>';
            return;
        }
        
        // Separate pinned and normal notices
        const pinned = data.filter(item => item.isPinned);
        const normal = data.filter(item => !item.isPinned);
        
        let html = '';
        
        // Render pinned notices
        if (pinned.length > 0) {
            html += '<div class="pinned-section"><h3><span class="material-icons">push_pin</span> Tin ghim</h3>';
            pinned.forEach(item => {
                html += this.createNoticeCard(item, true);
            });
            html += '</div>';
        }
        
        // Render normal notices
        if (normal.length > 0) {
            html += '<div class="normal-section"><h3>Tin mới nhất</h3>';
            normal.forEach(item => {
                html += this.createNoticeCard(item, false);
            });
            html += '</div>';
        }
        
        container.innerHTML = html;
    }
    
    createNoticeCard(item, isPinned) {
        return `
            <div class="accordion">
                <div class="accordion-header" onclick="app.toggleAccordion(this)">
                    <div class="accordion-header-left">
                        ${isPinned ? '<span class="material-icons" style="color: var(--warning);">push_pin</span>' : ''}
                        <div>
                            <h4>${item.tieuDe || 'Không có tiêu đề'}</h4>
                            <small style="color: var(--text-secondary);">
                                ${item.nguoiDang || 'Admin'} - ${item.thoiGian || 'N/A'}
                            </small>
                        </div>
                    </div>
                    <span class="material-icons accordion-icon">expand_more</span>
                </div>
                <div class="accordion-content">
                    <div style="padding: 16px;">
                        <p>${item.noiDung || 'Không có nội dung'}</p>
                        ${item.hinhAnh ? `<img src="${item.hinhAnh}" alt="Hình ảnh" style="max-width: 100%; margin-top: 12px; border-radius: 8px;">` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    async loadThanhVien() {
        // Load from chihoi.js
        this.renderThanhVien(chiHoiMembers);
    }
    
    renderThanhVien(members) {
        const container = document.getElementById('memberList');
        
        if (!members || members.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Không tìm thấy thành viên</p>';
            return;
        }
        
        let html = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Họ tên</th>
                            <th>Năm sinh</th>
                            <th>Địa chỉ</th>
                            <th>Đóng hội phí</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        members.forEach(member => {
            html += `
                <tr>
                    <td>${member.stt}</td>
                    <td>${member.hoTen}</td>
                    <td>${member.namSinh}</td>
                    <td>${member.diaChi}</td>
                    <td>
                        ${member.dongHoiPhi ? 
                            '<span class="badge badge-success">✓ Đã đóng</span>' : 
                            '<span class="badge badge-danger">✗ Chưa đóng</span>'}
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        container.innerHTML = html;
    }
    
    searchMembers() {
        const searchTerm = document.getElementById('memberSearch').value.toLowerCase();
        
        if (!searchTerm) {
            document.getElementById('memberList').innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nhập tên để tìm kiếm hoặc nhấn "Xem tất cả"</p>';
            return;
        }
        
        const filtered = chiHoiMembers.filter(member => 
            member.hoTen.toLowerCase().includes(searchTerm)
        );
        
        this.renderThanhVien(filtered);
    }
    
    showAllMembers() {
        this.renderThanhVien(chiHoiMembers);
    }
    
    async loadUngHoStats() {
        try {
            const result = await this.callAPI('getUngHo');
            if (result.success) {
                const total = result.data.reduce((sum, item) => sum + (parseFloat(item.soTien) || 0), 0);
                document.getElementById('totalUngHo').textContent = this.formatCurrency(total);
                
                // Generate QR code
                this.generateQRCode();
            }
        } catch (error) {
            console.error('Load ung ho error:', error);
            document.getElementById('totalUngHo').textContent = '0';
        }
    }
    
    generateQRCode() {
        const qrContainer = document.getElementById('qrcode');
        const qrData = 'https://img.vietqr.io/image/VCB-1234567890-compact2.jpg';
        qrContainer.innerHTML = `<img src="${qrData}" alt="QR Code" style="width: 200px; height: 200px;">`;
    }
    
    async loadTaiChinh() {
        try {
            const result = await this.callAPI('getTaiChinh');
            if (result.success) {
                this.renderTaiChinh(result.data);
            }
        } catch (error) {
            console.error('Load tai chinh error:', error);
            this.renderTaiChinh([]);
        }
    }
    
    renderTaiChinh(data) {
        const tbody = document.getElementById('taiChinhBody');
        const tfoot = document.getElementById('taiChinhFooter');
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Chưa có dữ liệu</td></tr>';
            return;
        }
        
        let html = '';
        let totalThu = 0;
        let totalChi = 0;
        let soDu = 0;
        
        data.forEach(item => {
            const thu = parseFloat(item.thu) || 0;
            const chi = parseFloat(item.chi) || 0;
            soDu += thu - chi;
            totalThu += thu;
            totalChi += chi;
            
            html += `
                <tr>
                    <td>${item.ngay || 'N/A'}</td>
                    <td>${item.noiDung || ''}</td>
                    <td style="color: var(--success);">${thu > 0 ? this.formatCurrency(thu) : ''}</td>
                    <td style="color: var(--danger);">${chi > 0 ? this.formatCurrency(chi) : ''}</td>
                    <td>${this.formatCurrency(soDu)}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        tfoot.innerHTML = `
            <tr style="font-weight: bold; background: var(--primary-light);">
                <td colspan="2">Tổng cộng</td>
                <td style="color: var(--success);">${this.formatCurrency(totalThu)}</td>
                <td style="color: var(--danger);">${this.formatCurrency(totalChi)}</td>
                <td>Tồn quỹ: ${this.formatCurrency(soDu)}</td>
            </tr>
        `;
    }
    
    // ============================================
    // Form Submissions
    // ============================================
    async submitGopY(event) {
        event.preventDefault();
        
        const data = {
            hoTen: document.getElementById('gopYHoTen').value,
            dienThoai: document.getElementById('gopYDienThoai').value,
            noiDung: document.getElementById('gopYNoiDung').value
        };
        
        this.showLoading();
        
        try {
            const result = await this.callAPI('addGopY', data);
            if (result.success) {
                this.showToast('Gửi ý kiến thành công!', 'success');
                event.target.reset();
            } else {
                this.showToast('Có lỗi xảy ra!', 'error');
            }
        } catch (error) {
            console.error('Submit gop y error:', error);
            this.showToast('Gửi ý kiến thành công! (Dữ liệu mẫu)', 'success');
            event.target.reset();
        } finally {
            this.hideLoading();
        }
    }
    
    async submitBaoTin(event) {
        event.preventDefault();
        
        const data = {
            nguoiBao: document.getElementById('baoTinNguoiBao').value,
            dienThoai: document.getElementById('baoTinDienThoai').value,
            nguoiCaoTuoi: document.getElementById('baoTinNCT').value,
            noiDung: document.getElementById('baoTinNoiDung').value
        };
        
        this.showLoading();
        
        try {
            const result = await this.callAPI('addBaoTin', data);
            if (result.success) {
                this.showToast('Báo tin thành công!', 'success');
                event.target.reset();
            } else {
                this.showToast('Có lỗi xảy ra!', 'error');
            }
        } catch (error) {
            console.error('Submit bao tin error:', error);
            this.showToast('Báo tin thành công! (Dữ liệu mẫu)', 'success');
            event.target.reset();
        } finally {
            this.hideLoading();
        }
    }
    
    // ============================================
    // Utility Functions
    // ============================================
    toggleDarkMode() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem(CONFIG.STORAGE_KEYS.DARK_MODE, newTheme === 'dark');
        
        document.getElementById('darkModeIcon').textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
    }
    
    togglePassword(inputId) {
        const input = document.getElementById(inputId);
        const icon = input.nextElementSibling.querySelector('.material-icons');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.textContent = 'visibility';
        } else {
            input.type = 'password';
            icon.textContent = 'visibility_off';
        }
    }
    
    toggleAccordion(header) {
        header.classList.toggle('active');
        const content = header.nextElementSibling;
        content.classList.toggle('active');
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };
        
        toast.innerHTML = `
            <span class="material-icons">${icons[type] || icons.info}</span>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    switchLoginTab(tab) {
        const tabs = document.querySelectorAll('.tab-button');
        const forms = document.querySelectorAll('.login-form');
        
        tabs.forEach(t => t.classList.remove('active'));
        forms.forEach(f => f.classList.remove('active'));
        
        if (tab === 'member') {
            tabs[0].classList.add('active');
            document.getElementById('memberLogin').classList.add('active');
        } else {
            tabs[1].classList.add('active');
            document.getElementById('adminLogin').classList.add('active');
        }
    }
    
    showChangePasswordForm() {
        const container = document.getElementById('sectionsContainer');
        container.innerHTML = `
            <div class="section-header">
                <h2><span class="material-icons">lock</span> Đổi mật khẩu Admin</h2>
            </div>
            <div class="card">
                <form onsubmit="app.changePassword(event)">
                    <div class="form-group">
                        <label>Mật khẩu cũ</label>
                        <div class="password-input-group">
                            <input type="password" id="oldPassword" class="form-control" required>
                            <button type="button" class="toggle-password" onclick="app.togglePassword('oldPassword')">
                                <span class="material-icons">visibility_off</span>
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Mật khẩu mới</label>
                        <div class="password-input-group">
                            <input type="password" id="newPassword" class="form-control" required>
                            <button type="button" class="toggle-password" onclick="app.togglePassword('newPassword')">
                                <span class="material-icons">visibility_off</span>
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Xác nhận mật khẩu mới</label>
                        <div class="password-input-group">
                            <input type="password" id="confirmPassword" class="form-control" required>
                            <button type="button" class="toggle-password" onclick="app.togglePassword('confirmPassword')">
                                <span class="material-icons">visibility_off</span>
                            </button>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">
                        <span class="material-icons">save</span>
                        Lưu thay đổi
                    </button>
                </form>
            </div>
        `;
    }
    
    async changePassword(event) {
        event.preventDefault();
        
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            this.showToast('Mật khẩu mới không khớp!', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showToast('Mật khẩu mới phải có ít nhất 6 ký tự!', 'warning');
            return;
        }
        
        this.showLoading();
        
        try {
            const result = await this.callAPI('changePassword', {
                oldPassword,
                newPassword
            });
            
            if (result.success) {
                this.showToast('Đổi mật khẩu thành công!', 'success');
                this.showAdminDashboard();
            } else {
                this.showToast(result.message || 'Mật khẩu cũ không đúng!', 'error');
            }
        } catch (error) {
            console.error('Change password error:', error);
            this.showToast('Lỗi kết nối! Vui lòng thử lại.', 'error');
        } finally {
            this.hideLoading();
        }
    }
}

// ============================================
// Initialize App
// ============================================
const app = new App();

// Global functions for HTML onclick handlers
function switchLoginTab(tab) {
    app.switchLoginTab(tab);
}

function loginAsMember() {
    app.loginAsMember();
}

function loginAsAdmin() {
    app.loginAsAdmin();
}

function logout() {
    app.logout();
}

function navigateTo(page) {
    app.navigateTo(page);
}

function goBack() {
    app.goBack();
}

function showSection(section) {
    app.showSection(section);
}

function toggleDarkMode() {
    app.toggleDarkMode();
}

function togglePassword(inputId) {
    app.togglePassword(inputId);
}