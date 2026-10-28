import { createRemoteJWKSet, jwtVerify } from "npm:jose@5.10.0";
import { Pool } from "jsr:@db/postgres@0.19.5";

/**
 * Generalized, fail-closed DB reference migration.
 * IMPORTANT: this function does not copy Drive files or verify ACLs.
 * MIGRATION_ENABLED must remain false until a separate trusted Drive
 * verification step is implemented and independently tested.
 */
const AUDIENCE = "dokterambis-drive-migration-v2";
const WORKFLOW = "gangsardamai/dokter-ambis-v2/.github/workflows/drive-migration-general.yml@refs/heads/main";
const ROOTS: Record<string, string> = {
  "3acc7360-a563-400d-a4a6-eaee27b7c9fc": "1pw3WRWL51vS2Sqq-tRisZxQbLtt0-GoK",
  "d8bfdd8d-7b72-419c-9a50-5895e2a55843": "1ID8A2G-vzqYtvlwKNbphF-r3YZe7JdGz",
  "98761235-d018-4371-b6f3-d98c5248f87e": "1blaNj3tuaSH93U5RlI67kHGPJonDhCxf",
  "70e67564-38a2-4776-91ef-52ff9fe99650": "1siltu51gzgIXvFeTXKdTqBVrZrGzNdOX",
  "3bb524a0-f687-486f-b9b6-d3f33574c71c": "1D3YbuZYGR-WdMkCbhu8xEWoROLhBbNSY",
  "59e2a2a6-678d-4bb6-a95c-f20ba3de0e72": "1DhYW5FZwFQv27VTOt0oklAPvAnPrtjgT",
  "d0a91908-d159-4aa8-a0ce-1f190144eb61": "1ZEXQGXra2w0yApnT3IZMPoq9ttcgGSrq",
  "e90e1c88-9985-49d3-ab60-2a5d2efe8188": "107VeCHPVr6XlaazbnXEdQMVDmIp7UOto",
  "be58ba2e-0d5e-4617-9f83-7fdf6e237eb2": "1nQHkBdrXApYVzVU9duvmGpqoGzj4qkZT",
  "60976804-c4fd-4651-8c07-c92d9d5b47b4": "1le7DzELd1mnvcJ6MTMasyrUr_FRm-kwE",
  "d7c59403-102f-42cc-8186-8a473b604557": "1B0BPvwWeXXL4NZfJ61D7xgFVIMZpb_GW",
  "aa4a2839-c6d1-4afb-8c2c-7732bb0e446d": "1ZPmRGt7jDXCKZphtnmst-zgr9IMGsKR5",
  "50b4ef9e-e572-494c-ae81-e22a8c2c47ea": "14OSkhIiOP6SgeQl-zzGvmV3GZWP4SYXb",
  "b575f68c-8bcb-4f98-ab0f-0f51b96a5207": "1ZEBxbR8u4sQT61-4pxS6hQIsLPdU3nos",
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DRIVE_ID = /^[A-Za-z0-9_-]{15,100}$/;
type Entry = {kind:"file"|"video"; row:string; lesson:string; old:string; next:string};
type Manifest = {course:string; root:string; entries:Entry[]; driveVerification?:unknown};
type Ref = {id:string; lesson_id:string; course_id:string; file_path?:string; provider?:string; provider_video_id?:string};
type Db = Awaited<ReturnType<Pool["connect"]>>;
const dbUrl = Deno.env.get("SUPABASE_DB_URL");
const pool = dbUrl ? new Pool(dbUrl,1) : null;
const jwks = createRemoteJWKSet(new URL("https://token.actions.githubusercontent.com/.well-known/jwks"));
const respond=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
async function authenticate(req:Request){
  const h=req.headers.get("authorization")||"";
  if(!h.startsWith("Bearer ") || h.length>5000) return false;
  try{
    const {payload}=await jwtVerify(h.slice(7),jwks,{
      issuer:"https://token.actions.githubusercontent.com",audience:AUDIENCE,
      algorithms:["RS256"],clockTolerance:"5 seconds"
    });
    return payload.repository_id==="1286701837" &&
      payload.repository==="gangsardamai/dokter-ambis-v2" &&
      payload.actor_id==="296064762" &&
      payload.workflow_ref===WORKFLOW &&
      payload.ref==="refs/heads/main" && payload.event_name==="workflow_dispatch";
  }catch{return false;}
}
function validate(m:Manifest){
  if(!m || typeof m!=="object" || !UUID.test(m.course) || ROOTS[m.course]!==m.root)
    throw Error("Course/root not allowlisted");
  if(!Array.isArray(m.entries)||m.entries.length<1||m.entries.length>10)
    throw Error("Manifest must have 1-10 rows");
  const keys=new Set<string>(), sources=new Map<string,string>();
  for(const e of m.entries){
    if(!e||!["file","video"].includes(e.kind)||!UUID.test(e.row)||!UUID.test(e.lesson)||
       !DRIVE_ID.test(e.old)||(e.next!=="AUTO"&&!DRIVE_ID.test(e.next))||e.old===e.next) throw Error("Invalid entry");
    const key=e.kind+":"+e.row;
    if(keys.has(key)) throw Error("Duplicate row");
    keys.add(key);
    if(sources.has(e.old) && sources.get(e.old)!==e.next) throw Error("Conflicting copies for source");
    sources.set(e.old,e.next);
  }
}
async function refs(db:Db,id:string){
  const files=(await db.queryObject<Ref>({text:
    "select lf.id::text,lf.lesson_id::text,l.course_id::text,lf.file_path from public.lesson_files lf join public.lessons l on l.id=lf.lesson_id where strpos(coalesce(lf.file_path,''),$1)>0",
    args:[id]})).rows;
  const videos=(await db.queryObject<Ref>({text:
    "select v.id::text,v.lesson_id::text,l.course_id::text,v.provider,v.provider_video_id from public.videos v join public.lessons l on l.id=v.lesson_id where strpos(coalesce(v.provider_video_id,''),$1)>0",
    args:[id]})).rows;
  return {files,videos};
}
async function audit(db:Db,m:Manifest){
  const rows=[];
  for(const e of m.entries){
    const a=await refs(db,e.old),b=await refs(db,e.next);
    const oldMatches=e.kind==="file"?a.files:a.videos;
    const newMatches=e.kind==="file"?b.files:b.videos;
    const otherOld=e.kind==="file"?a.videos:a.files;
    const otherNew=e.kind==="file"?b.videos:b.files;
    const correct=(r:Ref,id:string)=>r.id===e.row && r.lesson_id===e.lesson &&
      r.course_id===m.course && (e.kind==="file"?
        r.file_path==="google-drive://"+id:
        r.provider==="google_drive" && r.provider_video_id===id);
    const ready=oldMatches.length===1 && correct(oldMatches[0],e.old) &&
      newMatches.length===0 && !otherOld.length && !otherNew.length;
    const migrated=newMatches.length===1 && correct(newMatches[0],e.next) &&
      oldMatches.length===0 && !otherOld.length && !otherNew.length;
    rows.push({kind:e.kind,row:e.row,ready,migrated,oldRefs:a.files.length+a.videos.length,newRefs:b.files.length+b.videos.length});
  }
  return {ready:rows.every(x=>x.ready),migrated:rows.every(x=>x.migrated),rows};
}

type DriveFile = {id:string;name:string;mimeType:string;size?:string;md5Checksum?:string;parents?:string[];owners?:{emailAddress?:string}[];appProperties?:Record<string,string>;trashed?:boolean};
const API="https://www.googleapis.com/drive/v3";
const MAIN_OWNER="ambitious.premium@gmail.com";
async function driveToken(){
  const client_id=Deno.env.get("DRIVE_MIGRATION_CLIENT_ID");
  const client_secret=Deno.env.get("DRIVE_MIGRATION_CLIENT_SECRET");
  const refresh_token=Deno.env.get("DRIVE_MIGRATION_REFRESH_TOKEN");
  if(!client_id||!client_secret||!refresh_token)throw Error("drive_oauth_not_configured");
  const res=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:new URLSearchParams({client_id,client_secret,refresh_token,grant_type:"refresh_token"})});
  if(!res.ok)throw Error("drive_oauth_failed");
  const data=await res.json();if(!data.access_token)throw Error("drive_token_missing");
  return data.access_token as string;
}
async function drive<T>(token:string,path:string,init:RequestInit={}):Promise<T>{
  const res=await fetch(API+path,{...init,headers:{Authorization:"Bearer "+token,...(init.headers||{})}});
  if(!res.ok)throw Error("drive_api_"+res.status);
  return await res.json() as T;
}
const fileFields="id,name,mimeType,size,md5Checksum,parents,owners(emailAddress),appProperties,trashed";
async function getFile(token:string,id:string){
  return drive<DriveFile>(token,"/files/"+encodeURIComponent(id)+"?fields="+encodeURIComponent(fileFields));
}
async function acl(token:string,id:string){
  const x=await drive<{permissions?:{id?:string;type?:string;role?:string;emailAddress?:string;domain?:string;allowFileDiscovery?:boolean;deleted?:boolean}[];nextPageToken?:string}>(token,
    "/files/"+encodeURIComponent(id)+"/permissions?fields="+encodeURIComponent("nextPageToken,permissions(id,type,role,emailAddress,domain,allowFileDiscovery,deleted)")+"&pageSize=1000");
  if(x.nextPageToken)throw Error("permission_pagination_not_supported");
  if(!x.permissions?.length)throw Error("permissions_not_verifiable");
  return x.permissions.filter(p=>p.role!=="owner"&&!p.deleted)
    .map(p=>[p.type,p.role,p.emailAddress||"",p.domain||"",String(p.allowFileDiscovery??"")].join("|")).sort();
}
async function lineage(token:string,id:string,root:string){
  const seen=new Set<string>();
  let cursor=id;
  for(let i=0;i<16;i++){
    if(cursor===root)return true;
    if(seen.has(cursor))throw Error("cyclic_parent");
    seen.add(cursor);
    const m=await getFile(token,cursor);
    if(m.trashed||!m.parents||m.parents.length!==1)return false;
    cursor=m.parents[0];
  }
  return false;
}
async function resolveCopy(token:string,source:DriveFile){
  const parent=source.parents![0];
  const q="'"+parent.replaceAll("'","\\'")+"' in parents and trashed = false and appProperties has { key='ownership_source_id' and value='"+source.id+"' }";
  const found=await drive<{files:DriveFile[];nextPageToken?:string}>(token,
    "/files?q="+encodeURIComponent(q)+"&fields="+encodeURIComponent("nextPageToken,files("+fileFields+")")+"&pageSize=100");
  if(found.nextPageToken||found.files.length>1)throw Error("ambiguous_existing_copy");
  if(found.files.length===1)return found.files[0];
  return drive<DriveFile>(token,"/files/"+encodeURIComponent(source.id)+"/copy?fields="+encodeURIComponent(fileFields),{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({name:source.name,parents:[parent],appProperties:{ownership_source_id:source.id}})
  });
}
async function trustedDriveBatch(m:Manifest){
  const token=await driveToken();
  const about=await drive<{user?:{emailAddress?:string}}>(token,"/about?fields=user(emailAddress)");
  if(about.user?.emailAddress?.toLowerCase()!==MAIN_OWNER)throw Error("wrong_drive_identity");
  // This root has no year label: hold until 2026 classification is verified separately.
  if(m.course==="d0a91908-d159-4aa8-a0ce-1f190144eb61")throw Error("unram_family_2026_scope_not_verified");
  const unique=[...new Set(m.entries.map(e=>e.old))];
  if(unique.length>10)throw Error("too_many_sources");
  const sourceFiles=new Map<string,DriveFile>();
  let bytes=0; let commonParent:string|undefined;
  for(const id of unique){
    const src=await getFile(token,id);
    if(src.trashed||src.id!==id||src.mimeType==="application/vnd.google-apps.folder"||!src.parents||src.parents.length!==1)throw Error("invalid_source");
    if(src.name.toLowerCase().includes("2025")||src.name.toLowerCase().includes("untuk admin"))throw Error("excluded_source");
    if(src.owners?.length!==1||!src.owners[0]?.emailAddress||src.owners[0].emailAddress.toLowerCase()===MAIN_OWNER)throw Error("invalid_source_owner");
    if(!await lineage(token,src.parents[0],m.root))throw Error("outside_allowlist_root");
    if(!commonParent)commonParent=src.parents[0];
    if(commonParent!==src.parents[0])throw Error("one_folder_per_session");
    if(!src.size)throw Error("unknown_size");
    bytes+=Number(src.size);if(!Number.isSafeInteger(bytes)||bytes>1000000000)throw Error("batch_over_1gb");
    sourceFiles.set(id,src);
  }
  // Reuse of an old ID is permitted only if the supplied manifest covers all DB rows.
  const copies=new Map<string,DriveFile>();
  for(const src of sourceFiles.values()){
    const cp=await resolveCopy(token,src);
    if(!cp||cp.id===src.id||cp.trashed||cp.name!==src.name||
       cp.parents?.length!==1||cp.parents[0]!==src.parents![0]||
       cp.mimeType!==src.mimeType||(src.size&&cp.size!==src.size)||
       (src.md5Checksum&&cp.md5Checksum!==src.md5Checksum)||
       cp.owners?.length!==1||cp.owners[0]?.emailAddress?.toLowerCase()!==MAIN_OWNER)
      throw Error("copy_integrity_or_owner_mismatch");
    const [a,b]=await Promise.all([acl(token,src.id),acl(token,cp.id)]);
    if(JSON.stringify(a)!==JSON.stringify(b))throw Error("copy_acl_mismatch");
    copies.set(src.id,cp);
  }
  for(const e of m.entries)if(e.next!=="AUTO"&&copies.get(e.old)?.id!==e.next)throw Error("manifest_copy_id_mismatch");
  return {sources:unique.length,bytes,permissionsUnchanged:true,copyIds:Object.fromEntries([...copies].map(([k,v])=>[k,v.id]))};
}
async function completeAudit(db:Db,m:Manifest){
  for(const sourceId of new Set(m.entries.map(e=>e.old))){
    const refsBefore=await refs(db,sourceId);
    const all=[...refsBefore.files.map(x=>({kind:"file",...x})),...refsBefore.videos.map(x=>({kind:"video",...x}))];
    const matching=m.entries.filter(x=>x.old===sourceId);
    if(all.length!==matching.length||all.some(r=>!matching.some(e=>e.kind===r.kind&&e.row===r.id&&e.lesson===r.lesson_id&&r.course_id===m.course)))
      throw Error("unmapped_source_references");
  }
}
Deno.serve(async(req)=>{
  if(req.method!=="POST")return respond({ok:false,error:"method_not_allowed"},405);
  if(!await authenticate(req))return respond({ok:false,error:"unauthorized"},403);
  let body:{action:string;manifest:Manifest};
  try{body=await req.json();validate(body.manifest);}catch{return respond({ok:false,error:"invalid_manifest"},400);}
  if(!["preview","migrate"].includes(body.action))return respond({ok:false,error:"invalid_action"},400);
  if(!pool)return respond({ok:false,error:"database_unavailable"},503);
  const db=await pool.connect();
  try{
    if(body.action==="preview"){
      const state=await audit(db,body.manifest);
      return respond({ok:true,action:"preview",...state,sourceDeleted:false,permissionsChanged:false});
    }
    if(Deno.env.get("DRIVE_MIGRATION_V2_ENABLED")!=="true")
      return respond({ok:false,error:"migration_not_enabled"},409);
    // Network calls to Drive occur BEFORE the DB transaction, which remains atomic.
    // A copied file may remain if the subsequent DB stage fails; appProperties makes retries idempotent.
    const before=await audit(db,body.manifest);
    if(before.migrated)return respond({ok:true,alreadyMigrated:true,sourceDeleted:false});
    await completeAudit(db,body.manifest);
    if(!before.ready)return respond({ok:false,error:"preflight_not_ready"},409);
    const verified=await trustedDriveBatch(body.manifest);
    const actual:Manifest={...body.manifest,entries:body.manifest.entries.map(e=>({...e,next:verified.copyIds[e.old]}))};
    validate(actual);
    await db.queryArray("BEGIN");
    try{
      await db.queryArray("select pg_advisory_xact_lock(hashtext($1))",["drive-migration-"+body.manifest.course]);
      await completeAudit(db,actual);
      const locked=await audit(db,actual);
      if(!locked.ready)throw Error("preflight_changed");
      let changed=0;
      for(const e of actual.entries){
        const result=e.kind==="file"?
          await db.queryObject<{id:string}>({text:"update public.lesson_files set file_path=$1 where id=$2::uuid and lesson_id=$3::uuid and file_path=$4 returning id::text",args:["google-drive://"+e.next,e.row,e.lesson,"google-drive://"+e.old]}):
          await db.queryObject<{id:string}>({text:"update public.videos set provider_video_id=$1 where id=$2::uuid and lesson_id=$3::uuid and provider='google_drive' and provider_video_id=$4 returning id::text",args:[e.next,e.row,e.lesson,e.old]});
        if(result.rows.length!==1)throw Error("unexpected_update_count");
        changed++;
      }
      const after=await audit(db,actual);
      if(!after.migrated)throw Error("postflight_failed");
      await db.queryArray("COMMIT");
      return respond({ok:true,migrated:true,changed,sources:verified.sources,bytes:verified.bytes,permissionsUnchanged:true,sourceDeleted:false,permissionsChanged:false});
    }catch(e){await db.queryArray("ROLLBACK").catch(()=>undefined);throw e;}
  }catch(e){
    const message=e instanceof Error?e.message:"unknown";
    console.error("Safe migration stopped",message);
    return respond({ok:false,error:message,sourceDeleted:false,permissionsChanged:false},409);
  }finally{db.release();}
});
