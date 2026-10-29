-- ==========================================================
-- ConnectReal Supabase Database Schema & Realtime Setup
-- ==========================================================

-- 1. Tabel Profil Pengguna (Users)
create table if not exists public.users (
  id text primary key,
  name text not null,
  username text unique not null,
  email text unique not null,
  avatar_url text,
  banner_url text,
  banner_type text default 'image',
  bio text default '',
  location text default '',
  phone text default '',
  is_online boolean default true,
  followers_count integer default 0,
  following_count integer default 0,
  posts_count integer default 0,
  is_private boolean default false,
  show_online_status boolean default true,
  online_visibility text default 'everyone',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Tabel Postingan Linimasa (Posts)
create table if not exists public.posts (
  id text primary key,
  author_id text not null references public.users(id) on delete cascade,
  content text not null,
  media_url text,
  media_urls jsonb default '[]'::jsonb,
  filter text,
  tagged_users jsonb default '[]'::jsonb,
  music_track jsonb,
  likes_count integer default 0,
  comments_count integer default 0,
  reposts_count integer default 0,
  liked_by jsonb default '[]'::jsonb,
  reposted_by jsonb default '[]'::jsonb,
  comments jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 3. Tabel Cerita 24 Jam (Stories)
create table if not exists public.stories (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  media_url text not null,
  media_type text default 'image',
  video_duration numeric default 10,
  quality text default 'high',
  text_overlays jsonb default '[]'::jsonb,
  stickers jsonb default '[]'::jsonb,
  tagged_users jsonb default '[]'::jsonb,
  tag_positions jsonb default '{}'::jsonb,
  visual_filter text,
  effect_overlay text,
  viewers jsonb default '[]'::jsonb,
  liked_by jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '24 hours')
);

-- 4. Tabel Percakapan Obrolan (Conversations)
create table if not exists public.conversations (
  id text primary key,
  participant_ids jsonb not null,
  last_message_preview text,
  last_message_time timestamptz default now(),
  unread_counts jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- 5. Tabel Pesan Obrolan (Messages)
create table if not exists public.messages (
  id text primary key,
  conversation_id text not null references public.conversations(id) on delete cascade,
  sender_id text not null references public.users(id) on delete cascade,
  content text default '',
  type text default 'text',
  media_url text,
  media_urls jsonb default '[]'::jsonb,
  audio_duration numeric,
  file_name text,
  file_size text,
  call_log jsonb,
  is_read boolean default false,
  is_deleted_for_everyone boolean default false,
  deleted_for_users jsonb default '[]'::jsonb,
  is_edited boolean default false,
  reply_to jsonb,
  story_reply jsonb,
  reactions jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 6. Storage Bucket untuk Media (Foto, Video, Voice Notes)
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- 7. Policy Akses Publik untuk Bucket Storage Media
create policy "Public Access Media Bucket"
on storage.objects for select
using (bucket_id = 'media');

create policy "Allow Media Uploads"
on storage.objects for insert
with check (bucket_id = 'media');

-- 8. Enable Realtime Publications
alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.stories;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;

