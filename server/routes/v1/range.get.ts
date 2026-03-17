// TODO: GET /v1/range — Query params: country, from, to (max 366 days span). Return country, from, to,
// total_days, working_days, non_working_days, and days[] with date, is_working_day, day_type.
// Validate range and return 4xx if invalid; use auth + rateLimit middleware.
