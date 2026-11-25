import test from "node:test";
import assert from "node:assert/strict";
import {findNextBatch} from "../supabase/functions/drive-migration-general/next-batch.mjs";
import {copyAllowedByParent} from "../supabase/functions/drive-migration-general/access-policy.mjs";
const course="50b4ef9e-e572-494c-ae81-e22a8c2c47ea";
const lesson="5205a08d-340c-4166-b71a-6550612bd6aa";
const row="8b71f229-295f-44aa-8799-c508a6e95c38";
const source="171Qo2QnzLyxc0VwbUIzLJJeTmWzraJPv";
const parent="1xO_CrbYWvCK1A82ExI_qe3674VI91oNe";
const acl=[{type:"anyone",role:"writer",allowFileDiscovery:false}];
const deps=(owner="other@example.invalid")=>({
  driveToken:async()=>"mock-token",
  drive:async()=>({user:{emailAddress:"ambitious.premium@gmail.com"}}),
  getFile:async()=>({id:source,name:"Anatomi 2026.mp4",mimeType:"video/mp4",size:"141592048",parents:[parent],owners:[{emailAddress:owner}]}),
  acl:async()=>acl,lineage:async()=>true,copyAllowedByParent,
  refs:async()=>({files:[],videos:[{id:row,lesson_id:lesson,course_id:course,provider:"google_drive",provider_video_id:source}]}),
  ROOTS:{[course]:"root-folder-2026-abc"},MAIN_OWNER:"ambitious.premium@gmail.com"
});
const db={queryObject:async()=>({rows:[{kind:"video",row,lesson,old:source}]})};
test("selects exactly one verified nonowner source",async()=>{
  const m=await findNextBatch(db,deps());
  assert.equal(m.course,course);
  assert.equal(m.entries.length,1);
  assert.equal(m.entries[0].next,"AUTO");
});
test("never copies source already owned by main account",async()=>{
  assert.equal(await findNextBatch(db,deps("ambitious.premium@gmail.com")),null);
});
test("never selects a source with cross-course references",async()=>{
  const d=deps();
  d.refs=async()=>({files:[],videos:[{id:row,lesson_id:lesson,course_id:"11111111-1111-4111-8111-111111111111",provider:"google_drive",provider_video_id:source}]});
  assert.equal(await findNextBatch(db,d),null);
});
