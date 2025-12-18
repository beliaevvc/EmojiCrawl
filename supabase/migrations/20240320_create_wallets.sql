-- Создание таблицы для хранения кошельков пользователей
create table public.wallets (
  user_id uuid not null references auth.users on delete cascade primary key,
  crystals bigint default 0 check (crystals >= 0),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Включение RLS (Row Level Security)
alter table public.wallets enable row level security;

-- Политика: Пользователь может видеть только свой кошелек
create policy "Users can view own wallet" on public.wallets
  for select using (auth.uid() = user_id);

-- Политика: Пользователь может обновлять только свой кошелек
create policy "Users can update own wallet" on public.wallets
  for update using (auth.uid() = user_id);

-- Политика: Пользователь может создавать свой кошелек (если его нет)
create policy "Users can insert own wallet" on public.wallets
  for insert with check (auth.uid() = user_id);

-- Триггер для автоматического обновления updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_wallet_updated
  before update on public.wallets
  for each row execute procedure public.handle_updated_at();

-- Триггер для автоматического создания кошелька при регистрации
create or replace function public.handle_new_user_wallet()
returns trigger as $$
begin
  insert into public.wallets (user_id, crystals)
  values (new.id, 0);
  return new;
end;
$$ language plpgsql;

create trigger on_auth_user_created_wallet
  after insert on auth.users
  for each row execute procedure public.handle_new_user_wallet();

