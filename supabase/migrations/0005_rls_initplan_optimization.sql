alter policy "Users can view their own profile"
  on public.profiles
  using (id = (select auth.uid()));

alter policy "Users can view their own statements"
  on public.statements
  using (user_id = (select auth.uid()));

alter policy "Users can view their own transactions"
  on public.transactions
  using (user_id = (select auth.uid()));

alter policy "Users can view their own merchant categories"
  on public.user_merchant_categories
  using (user_id = (select auth.uid()));

alter policy "Users can view their own insights"
  on public.insights
  using (user_id = (select auth.uid()));
