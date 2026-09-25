/*
  CẤU HÌNH SUPABASE
  1. Copy file này thành config.local.js nếu muốn giữ cấu hình riêng.
  2. Điền URL và ANON KEY của Supabase.
  3. ANON KEY có thể xuất hiện ở frontend. Service Role Key TUYỆT ĐỐI KHÔNG được đưa vào đây.

  Khi deploy Vercel, bạn có thể thay giá trị bên dưới bằng biến môi trường
  thông qua build system, hoặc đơn giản điền trực tiếp URL + anon key.
*/
window.APP_CONFIG = {
  SUPABASE_URL: "https://ohgktmlgooaqgjlbschq.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_P6eyjAWnFLr7UaA_KZar6A_P7lDlTQ1",
  STORAGE_BUCKET: "card-images"
};
