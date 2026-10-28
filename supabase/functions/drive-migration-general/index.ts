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
       !DRIVE_ID.test(e.old)||!DRIVE_ID.test(e.next)||e.old===e.next) throw Error("Invalid entry");
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
Deno.serve(async(req)=>{
  if(req.method!=="POST") return respond({ok:false,error:"method_not_allowed"},405);
  if(!(await authenticate(req))) return respond({ok:false,error:"unauthorized"},403);
  let body:{action:string;manifest:Manifest};
  try{body=await req.json();validate(body.manifest);}
  catch{return respond({ok:false,error:"invalid_manifest"},400);}
  if(!["preview","migrate"].includes(body.action)) return respond({ok:false,error:"invalid_action"},400);
  if(!pool) return respond({ok:false,error:"database_unavailable"},503);
  const db=await pool.connect();
  try{
    if(body.action==="preview"){
      const state=await audit(db,body.manifest);
      return respond({ok:true,action:"preview",...state,
        backendWriteEnabled:false,driveMetadataVerified:false,sourceDeleted:false,permissionsChanged:false});
    }
    // A caller-supplied flag or 'attestation' is NOT evidence of Drive ownership/ACL.
    // Fail closed until trusted Drive API verification is implemented SERVER SIDE.
    if(Deno.env.get("DRIVE_MIGRATION_V2_ENABLED")!=="true")
      return respond({ok:false,error:"drive_verifier_not_ready",sourceDeleted:false},409);
    // Even with the switch, deliberately fail closed: no trusted Drive verification exists yet.
    return respond({ok:false,error:"trusted_drive_verification_required",sourceDeleted:false},409);
  }catch(e){
    console.error("Migration preview blocked",e instanceof Error?e.message:"unknown");
    return respond({ok:false,error:"audit_failed",sourceDeleted:false},409);
  }finally{db.release();}
});
