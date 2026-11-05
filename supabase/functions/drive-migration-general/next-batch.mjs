// Automatic selection: fixed allowlist, one folder/course, <=10 reference rows, <=1GB.
// No write or copy happens here. All metadata and reference constraints are checked again before migration.
const DRIVE_ID=/^[A-Za-z0-9_-]{15,100}$/;
export async function findNextBatch(db, deps) {
  const {driveToken, drive, getFile, acl, lineage, copyAllowedByParent, refs, ROOTS, MAIN_OWNER}=deps;
  const token=await driveToken();
  const identity=await drive(token,"/about?fields=user(emailAddress)");
  if(identity.user?.emailAddress?.toLowerCase()!==MAIN_OWNER)throw Error("wrong_drive_identity");
  const courses=Object.keys(ROOTS).filter(x=>x!=="d0a91908-d159-4aa8-a0ce-1f190144eb61");
  const localSlot=Math.floor((Date.now()+7*60*60*1000)/(4*60*60*1000));
  const course=courses[localSlot%courses.length],root=ROOTS[course];
  const rows=(await db.queryObject({
    text:"select 'video'::text kind,v.id::text row,v.lesson_id::text lesson,v.provider_video_id::text old "+
      "from public.videos v join public.lessons l on l.id=v.lesson_id "+
      "where l.course_id=$1::uuid and v.provider='google_drive' and v.provider_video_id ~ '^[A-Za-z0-9_-]{15,100}$' "+
      "union all select 'file'::text kind,lf.id::text row,lf.lesson_id::text lesson,substring(lf.file_path from 16)::text old "+
      "from public.lesson_files lf join public.lessons l on l.id=lf.lesson_id "+
      "where l.course_id=$1::uuid and lf.file_path ~ '^google-drive://[A-Za-z0-9_-]{15,100}$' "+
      "order by lesson,kind,row limit 100",args:[course]
  })).rows;
  const seen=new Set();
  let parent=null,bytes=0;
  const entries=[];
  for(const r of rows) {
    if(seen.size>=35||entries.length>=10)break;
    if(!DRIVE_ID.test(r.old)||seen.has(r.old))continue;
    seen.add(r.old);
    let source;
    try{source=await getFile(token,r.old);}catch{continue;}
    if(source.trashed||source.mimeType==="application/vnd.google-apps.folder"||
       source.parents?.length!==1||source.owners?.length!==1||!source.owners[0]?.emailAddress||
       source.owners[0].emailAddress.toLowerCase()===MAIN_OWNER||!source.size||
       /2025|untuk admin|try out/i.test(source.name))continue;
    if(parent&&source.parents[0]!==parent)continue;
    const size=Number(source.size);
    if(!Number.isSafeInteger(size)||size<=0||bytes+size>1000000000)continue;
    try{
      if(!await lineage(token,source.parents[0],root))continue;
      const [sourceACL,parentACL]=await Promise.all([acl(token,r.old),acl(token,source.parents[0])]);
      if(!copyAllowedByParent(sourceACL,parentACL))continue;
    }catch{continue;}
    const matches=await refs(db,r.old);
    const all=[...matches.files.map(x=>({...x,kind:"file"})),...matches.videos.map(x=>({...x,kind:"video"}))];
    if(!all.length||all.length+entries.length>10)continue;
    const mapped=[];
    let valid=true;
    for(const x of all){
      if(x.course_id!==course||(x.kind==="file"?
        x.file_path!=="google-drive://"+r.old:
        x.provider!=="google_drive"||x.provider_video_id!==r.old)){valid=false;break;}
      mapped.push({kind:x.kind,row:x.id,lesson:x.lesson_id,old:r.old,next:"AUTO"});
    }
    if(!valid)continue;
    parent=source.parents[0];bytes+=size;entries.push(...mapped);
  }
  return entries.length?{course,root,entries}:null;
}
