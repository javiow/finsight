create index idx_transactions_statement_id
  on public.transactions (statement_id);

create index idx_transactions_user_date
  on public.transactions (user_id, transaction_date desc);

create index idx_statements_user_created
  on public.statements (user_id, created_at desc);

create index idx_transactions_pending_classify
  on public.transactions (statement_id)
  where category is null;
