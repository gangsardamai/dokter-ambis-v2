import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs';
const s=JSON.parse(fs.readFileSync(new URL('./schema-before.json',import.meta.url),'utf8'));
export const db=new PGlite();
const qi=s=>'"'+s.replaceAll('"','""')+'"';
await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create schema private; create schema extensions; create table auth.users(id uuid primary key,email text default '',encrypted_password text,updated_at timestamptz default now()); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; create function auth.role() returns text language sql stable as $$select current_setting('role')$$; create function auth.jwt() returns jsonb language sql stable as $$select '{}'::jsonb$$; grant usage on schema auth,private to authenticated,anon; set check_function_bodies=off;`);
for(const e of s.enums) await db.exec(`create type ${qi(e.typname)} as enum (${e.labels.map(x=>"'"+x+"'").join(',')});`);
for(const t of s.tables) await db.exec(`create table ${qi(t.relname)} (${t.cols.map(c=>qi(c.name)+' '+c.type+(c.default?' default '+c.default:'')+(c.notnull?' not null':'')).join(',')});`);
for(const c of s.constraints.filter(c=>c.contype!=="t")) await db.exec(`alter table ${c.tbl} add constraint ${qi(c.conname)} ${c.def};`);
for(const f of s.functions) await db.exec(f.def);
for(const idx of s.indexes) await db.exec(idx);
for(const trigger of s.triggers) await db.exec(trigger);
for(const t of s.tables) if(t.relrowsecurity) await db.exec(`alter table ${qi(t.relname)} enable row level security;`);
for(const p of s.policies) await db.exec(`create policy ${qi(p.policyname)} on ${qi(p.tablename)} as ${p.permissive} for ${p.cmd} to ${p.roles.map(qi).join(',')} ${p.qual?'using ('+p.qual+')':''} ${p.with_check?'with check ('+p.with_check+')':''};`);
for(const g of s.grants) await db.exec(`grant ${g.privilege_type} on ${qi(g.table_name)} to ${qi(g.grantee)};`);
const permissions=JSON.parse(fs.readFileSync(new URL('./permissions-before.json',import.meta.url),'utf8'));
for(const g of permissions.columns) await db.exec(`grant ${g.privilege_type} (${qi(g.column_name)}) on ${qi(g.table_name)} to ${qi(g.grantee)};`);
for(const f of permissions.functions){
 await db.exec(`revoke all on function ${f.signature} from public,anon,authenticated;`);
 for(const role of ['anon','authenticated']) if(f[role])await db.exec(`grant execute on function ${f.signature} to ${role};`);
}
export async function asUser(id){await db.exec(`reset role; select set_config('request.jwt.claim.sub','${id}',false); set role authenticated;`)}
console.log('Schema loaded: '+s.tables.length+' tables, '+s.functions.length+' functions');
