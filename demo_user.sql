-- Demo user creation SQL for Supabase
-- Email: demo@example.com
-- Password: Demo2025

INSERT INTO users (
    email,
    encrypted_password,
    name,
    bio,
    uid,
    confirmed_at,
    created_at,
    updated_at,
    tokens,
    sign_in_count,
    is_admin
) VALUES (
    'demo@example.com',
    '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', -- Demo2025のbcryptハッシュ（標準的な値）
    'Demo User',
    'このアカウントはデモ用です。自由にお試しください。',
    'demo@example.com',
    NOW(),
    NOW(),
    NOW(),
    '{}',
    0,
    false
);

-- 確認用クエリ
SELECT id, email, name, confirmed_at, created_at 
FROM users 
WHERE email = 'demo@example.com';