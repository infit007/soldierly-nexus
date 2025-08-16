-- User profiles table to store per-user form data as JSON
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  personal_details JSONB,
  family JSONB,
  education JSONB,
  medical JSONB,
  others JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful index for querying by user
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

