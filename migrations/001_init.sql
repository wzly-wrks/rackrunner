-- USERS & DEVICES
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  upn text unique not null,
  name text not null,
  role text not null check (role in ('ADMIN','PACKER','FREEZER','AUDITOR')),
  created_at timestamptz default now()
);

create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  fingerprint text not null,
  created_at timestamptz default now(),
  revoked_at timestamptz
);

create table if not exists device_pins (
  device_id uuid primary key references devices(id) on delete cascade,
  pin_hash text not null,
  attempt_count int default 0,
  locked_until timestamptz
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  device_id uuid not null references devices(id),
  refresh_token_enc bytea not null,
  expires_at timestamptz not null,
  revoked_at timestamptz
);

-- RACKS & MEALS
create table if not exists racks (
  id text primary key,
  capacity int not null,
  status text not null check (status in ('OPEN','SEALED','IN_FREEZER','IN_USE')),
  opened_by uuid references users(id),
  opened_at timestamptz,
  closed_by uuid references users(id),
  closed_at timestamptz
);

create table if not exists meals (
  code text primary key,
  label text not null
);

insert into meals(code,label) values
 ('HH','Heart Healthy'),
 ('DIAL','Dialysis'),
 ('LP','Low-Protein'),
 ('GI','GI'),
 ('VEG','Veggie'),
 ('CHOP','Chopped'),
 ('NP','No Pork'),
 ('NB','No Beef')
on conflict (code) do nothing;

-- INTAKE ITEMS DURING OPEN RACK
create table if not exists rack_items (
  id bigserial primary key,
  rack_id text not null references racks(id),
  meal_code text not null references meals(code),
  batch_date date not null,
  serial text,
  scanned_by uuid references users(id),
  scanned_at timestamptz default now()
);

-- AGGREGATED FROZEN INVENTORY BY BATCH (FIFO)
create table if not exists inventory_batches (
  id bigserial primary key,
  meal_code text not null references meals(code),
  batch_date date not null,
  qty_total int not null,
  qty_available int not null,
  from_rack_id text not null references racks(id),
  sealed_at timestamptz not null,
  unique (meal_code, batch_date, from_rack_id)
);

-- PACKING REQUIREMENTS & FIFO ALLOCATIONS
create table if not exists packing_requirements (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  meal_code text not null references meals(code),
  qty_needed int not null
);

create table if not exists allocations (
  id bigserial primary key,
  requirement_id uuid not null references packing_requirements(id),
  batch_id bigint not null references inventory_batches(id),
  qty int not null,
  allocated_at timestamptz default now(),
  allocated_by uuid not null references users(id),
  override_fifo boolean default false,
  override_reason text
);

-- AUDIT
create table if not exists audit (
  id bigserial primary key,
  actor uuid references users(id),
  device_id uuid references devices(id),
  action text not null,
  payload jsonb,
  ts timestamptz default now()
);
