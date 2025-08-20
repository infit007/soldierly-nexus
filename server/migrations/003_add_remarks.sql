-- Add admin_remark and manager_response columns to requests table
ALTER TABLE requests ADD COLUMN admin_remark TEXT;
ALTER TABLE requests ADD COLUMN manager_response TEXT;
