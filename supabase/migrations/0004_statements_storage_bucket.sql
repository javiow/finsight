insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'statements',
  'statements',
  false,
  5242880,
  array['text/csv', 'application/vnd.ms-excel', 'text/plain']
)
on conflict (id) do nothing;
