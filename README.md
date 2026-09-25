# 🎑 Thiệp Trung Thu + QR + Supabase + Vercel

Website static HTML/CSS/JS tạo thiệp Trung Thu, lưu từng thiệp độc lập trên Supabase và tạo QR riêng cho từng thiệp.

## 1. Cấu trúc

```text
trung-thu-card/
├── index.html
├── style.css
├── script.js
├── config.js
├── supabase.sql
├── vercel.json
├── .gitignore
└── README.md
```

## 2. Tạo Supabase

1. Vào Supabase và tạo project.
2. Mở **SQL Editor**.
3. Mở file `supabase.sql`.
4. Chạy toàn bộ SQL.
5. Vào **Project Settings → API**.
6. Lấy:
   - Project URL
   - Publishable/anon key

## 3. Cấu hình website

Mở `config.js`:

```js
window.APP_CONFIG = {
  SUPABASE_URL: "https://YOUR_PROJECT.supabase.co",
  SUPABASE_ANON_KEY: "YOUR_ANON_KEY",
  STORAGE_BUCKET: "card-images"
};
```

Chỉ sử dụng anon/publishable key.

**Không bao giờ đưa Service Role Key vào frontend.**

## 4. Chạy local

Có thể dùng VS Code + Live Server.

Hoặc:

```bash
npx serve .
```

Không nên mở trực tiếp bằng `file://` vì một số tính năng web cần HTTP.

## 5. Deploy Vercel

Đưa project lên GitHub:

```bash
git init
git add .
git commit -m "Create Mid Autumn greeting card"
git branch -M main
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

Sau đó vào Vercel → New Project → import repository.

`vercel.json` đã có rewrite:

```text
/card/:id → /index.html
```

Vì vậy URL như:

```text
https://your-domain.vercel.app/card/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

vẫn mở đúng ứng dụng.

## 6. Cơ chế QR

Mỗi lần bấm "Tạo thiệp":

```text
crypto.randomUUID()
        ↓
ID mới
        ↓
Supabase INSERT
        ↓
/card/{ID}
        ↓
QR Code
```

Ví dụ:

```text
Thiệp A
/card/11111111-1111-1111-1111-111111111111

Thiệp B
/card/22222222-2222-2222-2222-222222222222
```

Thiệp B không ghi đè Thiệp A.

QR A vẫn mở `/card/111...`.

## 7. Ảnh

Ảnh được upload vào:

```text
card-images/
└── cards/
    └── {card-id}/
        ├── uuid1.jpg
        ├── uuid2.jpg
        └── uuid3.jpg
```

URL ảnh được lưu vào record của thiệp.

## 8. Lưu ý về tính "vĩnh viễn"

QR chỉ tiếp tục hoạt động nếu:

- Vercel project còn tồn tại.
- Domain/URL không bị thay đổi mà không có redirect.
- Supabase project còn tồn tại.
- Record thiệp không bị xóa.

Thiết kế hiện tại không cho frontend UPDATE/DELETE thiệp.

## 9. Giới hạn thực tế

Bản demo này cho phép anonymous user tạo thiệp. Nếu public trên Internet, nên bổ sung:

- CAPTCHA/Turnstile
- rate limit
- giới hạn dung lượng ảnh
- giới hạn số ảnh
- moderation nếu cho phép nội dung công khai
- Edge Function để kiểm soát upload nếu cần bảo mật cao hơn

## 10. Quan trọng về Storage

Bucket `card-images` được đặt public để URL ảnh trong thiệp có thể tải trực tiếp.

Nếu cần private images, phải đổi kiến trúc sang signed URLs hoặc proxy qua backend/Edge Function.

## 11. Chạy ngay

Sau khi điền `config.js`:

```text
index.html
   ↓
Nhập thông tin
   ↓
Tạo thiệp
   ↓
Upload ảnh
   ↓
Supabase lưu card
   ↓
Tạo URL /card/{id}
   ↓
Tạo QR
```

## Trang xem thiệp 3D

- URL `/card/{id}` là **trang xem thiệp**, không hiển thị nút Tạo mới, QR hay Chia sẻ.
- Thiệp có mặt trước và mặt sau 3D, có thể **kéo chuột hoặc vuốt bằng tay để xoay 360°**.
- Hỗ trợ kéo dọc nhẹ để thay đổi góc nghiêng X.
- Có quán tính khi thả tay và hiệu ứng nổi/lấp lánh nhẹ.
- Trên điện thoại, vùng thiệp dùng Pointer Events nên hỗ trợ touch/pointer trực tiếp.

Trang `/` vẫn là trang tạo thiệp và tạo QR như trước.



## v5 safe performance patch

This version keeps the v3 data/rendering pipeline intact so existing Supabase cards
continue to show their photos and messages. Performance changes are limited to
requestAnimationFrame transform coalescing, compositor hints, and fewer decorative
particles. Photos and greeting text are never hidden or paused.
