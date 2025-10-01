-- 누락된 설정값들 추가
-- Supabase SQL Editor에서 실행하세요

INSERT INTO store_settings (key, value, category, description, data_type, is_required, is_public) VALUES
-- 정책 URL
('TERMS_OF_SERVICE_URL', '/terms', 'policy', '이용약관 페이지 URL', 'string', true, true),
('PRIVACY_POLICY_URL', '/privacy', 'policy', '개인정보처리방침 페이지 URL', 'string', true, true),

-- SEO 및 마케팅 (추가)
('SITE_OG_IMAGE_URL', '/images/og-image.jpg', 'marketing', 'Open Graph 이미지 URL', 'string', false, true),

-- 분석 도구 (민감 정보이므로 is_public = false)
('GOOGLE_ANALYTICS_ID', '', 'marketing', 'Google Analytics ID', 'string', false, false),
('GOOGLE_TAG_MANAGER_ID', '', 'marketing', 'Google Tag Manager ID', 'string', false, false)

ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();