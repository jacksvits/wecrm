-- Add /news to allowedPages for all users who don't have it
UPDATE "users"
SET "allowed_pages" = array_append("allowed_pages", '/news')
WHERE NOT '/news' = ANY("allowed_pages");

-- Add /news to allowedPages for all roles who don't have it
UPDATE "roles"
SET "allowedpages" = array_append("allowedpages", '/news')
WHERE NOT '/news' = ANY("allowedpages");
