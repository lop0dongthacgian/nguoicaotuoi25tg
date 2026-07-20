# Hướng dẫn triển khai — Ứng dụng "Chăm Sóc Người Cao Tuổi"

Bộ tệp gồm:
- `index.html`, `style.css`, `app.js` — giao diện ứng dụng (Frontend)
- `chihoi.js` — danh sách thành viên chi hội (dữ liệu tĩnh, bạn tự chỉnh sửa)
- `code.gs` — mã nguồn Google Apps Script (Backend + kết nối Google Sheets)

Thực hiện lần lượt 4 bước dưới đây.

---

## Bước 1 — Tạo Google Sheet

1. Vào [Google Drive](https://drive.google.com), tạo một **thư mục** tên `nguoicaotuoi`.
2. Trong thư mục đó, tạo mới một **Google Sheet** (Google Trang tính), đặt tên tuỳ ý, ví dụ `CSDL_ChamSocNCT`.
3. **Không cần tạo sẵn các tab (sheet con)** — script sẽ tự động tạo đủ 6 sheet (`ThongBao`, `GopY`, `BaoTin`, `TaiChinh`, `UngHo`, `CauHinh`) và dòng tiêu đề khi chạy lần đầu.
   - Nếu bạn đã có sẵn Google Sheet muốn dùng, chỉ cần lấy ID của Sheet đó (đoạn ký tự trong đường dẫn URL, giữa `/d/` và `/edit`).
https://docs.google.com/spreadsheets/d/1wwLRplhGmoHA5lzlur8TTjBB6Pnjw9XaS2Rkq5HPJms/edit?usp=drivesdk
1wwLRplhGmoHA5lzlur8TTjBB6Pnjw9XaS2Rkq5HPJms
---

## Bước 2 — Tạo Apps Script và triển khai Web App

1. Mở Google Sheet vừa tạo → menu **Tiện ích mở rộng (Extensions) → Apps Script**.
2. Xoá toàn bộ nội dung mẫu trong file `Code.gs`, dán vào **toàn bộ nội dung file `code.gs`** đã cung cấp.
3. (Tuỳ chọn) Nếu bạn muốn dùng một Google Sheet khác với Sheet đang gắn Apps Script:
   - Mở Sheet đó, copy ID trong đường dẫn URL.
   - Dán ID vào dòng `const SPREADSHEET_ID = '';` trong `code.gs` (giữa hai dấu nháy đơn).
   - Nếu để trống, script mặc định dùng chính Sheet đang gắn Apps Script — **cách này đơn giản nhất, khuyến khích dùng**.
4. Nhấn **Lưu** (biểu tượng đĩa mềm hoặc `Ctrl+S`).
5. Nhấn nút **Triển khai (Deploy) → Triển khai mới (New deployment)**.
   - Nhấn biểu tượng bánh răng cạnh "Chọn loại" → chọn **Ứng dụng web (Web app)**.
   - **Mô tả**: tuỳ ý, ví dụ "Chăm sóc NCT v1".
   - **Thực thi với tư cách (Execute as)**: chọn **Tôi (email của bạn)**.
   - **Ai có quyền truy cập (Who has access)**: chọn **Bất kỳ ai (Anyone)** — *bắt buộc*, nếu không ứng dụng sẽ không gọi được API.
   - Nhấn **Triển khai (Deploy)**.
6. Lần đầu triển khai, Google sẽ yêu cầu **cấp quyền (Authorize access)**:
   - Chọn tài khoản Google của bạn → nếu hiện cảnh báo "Google chưa xác minh ứng dụng", nhấn **Nâng cao (Advanced)** → **Đi tới [tên dự án] (không an toàn)** → **Cho phép (Allow)**.
   - (Đây là cảnh báo mặc định của Google với mọi Apps Script tự viết, hoàn toàn bình thường vì đây là script do chính bạn tạo.)
7. Sau khi triển khai xong, Google sẽ hiển thị một **URL Web App** dạng:
   ```
   https://script.google.com/macros/s/AKfycb..................../exec
   ```
   **Copy URL này** — đây chính là "API_URL" bạn cần dán vào `app.js`.

> ⚠️ Mỗi lần bạn **sửa code.gs**, phải vào lại **Triển khai → Quản lý triển khai (Manage deployments) → biểu tượng bút chì → Phiên bản mới (New version) → Triển khai (Deploy)** thì thay đổi mới có hiệu lực trên Web App (URL không đổi).

---

## Bước 3 — Kết nối Frontend với Backend

1. Mở file `app.js`, tìm đoạn:
   ```javascript
   const CONFIG = {
     API_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
     ...
   };
   ```
2. Thay `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec` bằng **URL Web App** bạn vừa copy ở Bước 2.7.
3. Lưu file.

**Kiểm tra nhanh:** mở URL Web App trên trình duyệt và thêm `?action=getThongBao` vào cuối, ví dụ:
`https://script.google.com/macros/s/AKfycb..../exec?action=getThongBao`
Nếu thấy kết quả dạng `{"ok":true,"data":[]}` là kết nối thành công.

---

## Bước 4 — Triển khai giao diện lên Netlify hoặc Vercel

Ứng dụng chỉ gồm HTML/CSS/JS tĩnh nên triển khai rất đơn giản, **không cần build**.

### Cách A — Netlify (kéo & thả, nhanh nhất)
1. Vào [app.netlify.com/drop](https://app.netlify.com/drop).
2. Kéo cả 4 file `index.html`, `style.css`, `app.js`, `chihoi.js` (đã sửa `API_URL`) vào khung trên trang.
3. Netlify tự động cấp cho bạn một đường dẫn dạng `https://ten-ngau-nhien.netlify.app`.
4. (Tuỳ chọn) Vào **Site settings → Change site name** để đổi thành tên dễ nhớ hơn.

### Cách B — Vercel
1. Tạo tài khoản tại [vercel.com](https://vercel.com).
2. Tạo 1 thư mục trên máy tính, đặt 4 file trên vào đó.
3. Cài Vercel CLI: `npm i -g vercel`, sau đó trong thư mục đó chạy `vercel` và làm theo hướng dẫn (hoặc kéo thả thư mục vào giao diện web Vercel → **Add New → Project → Deploy** — vì đây là site tĩnh, Vercel sẽ tự nhận diện, không cần cấu hình build).

### Cách C — GitHub + Netlify/Vercel (khuyến khích nếu cần cập nhật thường xuyên)
1. Đẩy 4 file lên một repository GitHub.
2. Trong Netlify hoặc Vercel, chọn **Import from GitHub**, trỏ tới repository đó.
3. Mỗi lần bạn cập nhật code và `git push`, trang sẽ tự động triển khai lại.

---

## Thông tin đăng nhập mặc định

| Vai trò | Cách vào | Mật khẩu |
|---|---|---|
| Thành viên | Nhấn "Vào ứng dụng (Thành viên)" | Không cần |
| Quản trị | Nhấn "Đăng nhập Quản trị" | `admin2026` |

**Đổi mật khẩu ngay sau khi triển khai**: đăng nhập Quản trị → tab *Tài khoản* → *Vào Bảng điều khiển* → ô *Đổi mật khẩu*.

---

## Cập nhật danh sách thành viên chi hội (~300 thành viên)

Mở file `chihoi.js`, thêm các dòng theo đúng mẫu vào mảng `DANH_SACH_CHI_HOI`:
```javascript
{ stt: 25, hoTen: 'Nguyễn Văn X', namSinh: 1949, diaChi: 'Tổ 1, Khu phố 1', daDongHoiPhi: true },
```
Sau khi sửa xong, tải lại (re-deploy) 4 file lên Netlify/Vercel (kéo thả lại hoặc `git push`).

---

## Cập nhật thông tin chuyển khoản / mã QR ủng hộ

Đăng nhập Quản trị → *Bảng điều khiển* → *Quỹ ủng hộ* → *Sửa thông tin chuyển khoản / QR* để nhập số tài khoản, chủ tài khoản, ngân hàng và đường dẫn ảnh mã QR (bạn có thể tải ảnh QR lên Google Drive, bật chia sẻ công khai, rồi dùng link dạng `https://drive.google.com/uc?id=FILE_ID` làm đường dẫn ảnh).

---

## Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân thường gặp | Cách khắc phục |
|---|---|---|
| "Chưa cấu hình API_URL" | Chưa thay `API_URL` trong `app.js` | Làm lại Bước 3 |
| Trang trắng / không tải được dữ liệu | Chưa triển khai lại sau khi sửa `code.gs`, hoặc quyền truy cập Web App không phải "Anyone" | Kiểm tra lại Bước 2, mục "Ai có quyền truy cập" |
| Lỗi khi gửi biểu mẫu (góp ý, báo tin...) | URL Web App sai hoặc hết hạn phiên bản triển khai cũ | Tạo lại "New deployment" hoặc "New version", cập nhật `API_URL` mới nếu URL thay đổi |
| Sai mật khẩu quản trị dù đã đổi | Trình duyệt đang dùng dữ liệu cache cũ | Tải lại trang (Ctrl+F5) |

Chúc chi hội triển khai ứng dụng thành công! ❤️
