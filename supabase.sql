-- ============================================
-- THIỆP TRUNG THU - SUPABASE DATABASE
-- ============================================
-- Chạy toàn bộ script này trong Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.cards (
  id uuid primary key,
  recipient_name text not null check (char_length(recipient_name) between 1 and 80),
  sender_name text not null default '' check (char_length(sender_name) <= 80),
  main_message text not null check (char_length(main_message) between 1 and 300),
  sub_messages jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  theme text not null default 'pink',
  primary_color text not null default '#ff72b5',
  music_url text,
  effects jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.cards enable row level security;

-- Người nhận cần đọc được thiệp bằng QR.
drop policy if exists "public can read cards" on public.cards;
create policy "public can read cards"
on public.cards
for select
to anon, authenticated
using (true);

-- Website tạo thiệp trực tiếp bằng anon key.
-- Chỉ cho INSERT, không cho UPDATE/DELETE từ client.
drop policy if exists "public can create cards" on public.cards;
create policy "public can create cards"
on public.cards
for insert
to anon, authenticated
with check (
  char_length(recipient_name) between 1 and 80
  and char_length(main_message) between 1 and 300
  and char_length(sender_name) <= 80
);

-- Không tạo policy UPDATE/DELETE.
-- Vì vậy QR cũ không thể bị client sửa nội dung hoặc xóa thông qua frontend.

-- ============================================
-- STORAGE BUCKET
-- ============================================

insert into storage.buckets (id, name, public)
values ('card-images', 'card-images', true)
on conflict (id) do update set public = true;

-- Cho phép frontend upload ảnh.
drop policy if exists "public can upload card images" on storage.objects;
create policy "public can upload card images"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'card-images');

-- Cho phép đọc ảnh công khai.
drop policy if exists "public can read card images" on storage.objects;
create policy "public can read card images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'card-images');

-- Không cấp UPDATE/DELETE cho client.
-- Ảnh của các thiệp cũ vì thế không bị frontend xóa/ghi đè.
