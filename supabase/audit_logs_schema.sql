-- Audit rows are written only by this SECURITY DEFINER trigger. Clients cannot
-- forge history by inserting directly into this table.
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_value jsonb,
  new_value jsonb,
  user_id uuid references auth.users(id),
  changed_at timestamptz not null default now()
);

-- Older deployments used UUID here, while tasks use bigint identities.
alter table public.audit_logs
  alter column record_id type text using record_id::text;

create index if not exists audit_logs_changed_at_idx on public.audit_logs(changed_at desc);
create index if not exists audit_logs_table_record_idx on public.audit_logs(table_name, record_id);

alter table public.audit_logs enable row level security;
drop policy if exists "Users can view their own audit logs" on public.audit_logs;
drop policy if exists "Service role can insert audit logs" on public.audit_logs;
drop policy if exists "Admins can view audit logs" on public.audit_logs;

create policy "Admins can view audit logs" on public.audit_logs
  for select to authenticated
  using (public.is_app_admin());

revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_row jsonb;
  new_row jsonb;
  row_id text;
begin
  if tg_op = 'DELETE' then
    old_row := to_jsonb(old);
    new_row := null;
    row_id := old.id::text;
  elsif tg_op = 'INSERT' then
    old_row := null;
    new_row := to_jsonb(new);
    row_id := new.id::text;
  else
    old_row := to_jsonb(old);
    new_row := to_jsonb(new);
    row_id := new.id::text;
  end if;

  insert into public.audit_logs(table_name, record_id, action, old_value, new_value, user_id)
  values (tg_table_name, row_id, tg_op, old_row, new_row, auth.uid());
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.write_audit_log() from public;

drop trigger if exists tasks_audit_log on public.tasks;
create trigger tasks_audit_log
  after insert or update or delete on public.tasks
  for each row execute function public.write_audit_log();

drop trigger if exists app_users_audit_log on public.app_users;
create trigger app_users_audit_log
  after insert or update or delete on public.app_users
  for each row execute function public.write_audit_log();
