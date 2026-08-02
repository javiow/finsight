alter table public.insights
  add constraint insights_user_period_category_key
  unique (user_id, period, category);
