import fs from 'node:fs';
import assert from 'node:assert/strict';
try {
 const {db}=await import('./load.mjs');
 for (const migration of [
   '../../supabase/migrations/20260923035411_leader_access_integrity.sql',
   '../../supabase/migrations/20260924013700_leader_scoped_students_tryouts_mentors.sql',
   '../../supabase/migrations/20260924020200_leader_profile_promotion_guard.sql',
   '../../supabase/migrations/20260924024000_leader_course_explorer_mentor_rating.sql',
   '../../supabase/migrations/20260924025500_leader_scoped_course_content.sql',
 ]) {
   await db.exec(fs.readFileSync(new URL(migration, import.meta.url), 'utf8'));
 }
 const {asUser,id}=await import('./seed.mjs');
 let tests=0;
 async function query(sql){return (await db.query(sql)).rows}
 async function denied(name,sql){try{const rows=await query(sql);assert.equal(rows.length,0,name)}catch(e){if(e.code!=='42501')throw e;}console.log('PASS',name);tests++}
 async function allowed(name,sql){const r=await query(sql);assert(r.length>0,name);console.log('PASS',name);tests++;return r}
 await denied('unassigned course hidden',`select id from courses where id='${id(13)}'`);
 await allowed('assigned course visible',`select id from courses where id='${id(12)}'`);
 await allowed('scoped student visible',`select id from profiles where id='${id(3)}'`);
 await denied('out-of-scope student hidden',`select id from profiles where id='${id(6)}'`);
 await allowed('scoped student email query allowed',`select * from admin_get_student_emails(array['${id(3)}','${id(6)}']::uuid[])`);
 assert.equal((await query(`select count(*)::int count from admin_get_student_emails(array['${id(3)}','${id(6)}']::uuid[])`))[0].count,1);tests++;console.log('PASS out-of-scope student email filtered');
 await asUser(id(1));
 await db.exec(`update leader_permissions set enabled=false where leader_id='${id(2)}' and permission='manage_enrollment'`);
 await asUser(id(2));
 await allowed('student visibility is scope-only, not enrollment-permission-gated',`select id from profiles where id='${id(3)}'`);
 await allowed('scoped enrollment remains readable without management permission',`select id from enrollments where id='${id(30)}'`);
 await asUser(id(1));
 await db.exec(`update leader_permissions set enabled=true where leader_id='${id(2)}' and permission='manage_enrollment'`);
 await asUser(id(2));
 await allowed('Leader can reset scoped student devices',`select admin_reset_student_devices('${id(3)}')`);
 await allowed('Leader can promote scoped student to Mentor',`select admin_promote_student_to_mentor('${id(7)}')`);
 await denied('Leader cannot promote out-of-scope student',`select admin_promote_student_to_mentor('${id(6)}')`);
 await allowed('Leader creates Try Out in scoped course',`insert into tryouts(id,course_id,title,created_by,review_release_mode) values('${id(50)}','${id(12)}','Leader scoped TO','${id(2)}','immediate') returning id`);
 await denied('Leader cannot create Try Out outside scope',`insert into tryouts(id,course_id,title,created_by,review_release_mode) values('${id(51)}','${id(22)}','Forbidden TO','${id(2)}','immediate') returning id`);
 await asUser(id(1));
 await db.exec(`insert into tryouts(id,course_id,title,created_by,review_release_mode) values('${id(52)}','${id(12)}','Admin scoped TO','${id(1)}','immediate')`);
 await asUser(id(2));
 await allowed('Leader can manage existing Try Out in scope',`update tryouts set title='Leader managed TO' where id='${id(52)}' returning id`);
 await denied('ancestor edit denied',`update organizations set title='hacked' where id='${id(10)}' returning id`);
 await denied('ancestor program edit denied',`update programs set title='hacked' where id='${id(11)}' returning id`);
 await denied('sibling course creation denied',`select staff_create_master_record('course','{"title":"Sibling","slug":"sibling","organization_id":"${id(10)}","program_id":"${id(11)}","payment_account_id":"${id(9)}"}')`);
 const [org]=await allowed('create university without approval',`select staff_create_master_record('organization','{"title":"New University","short_name":"NEW","slug":"new-university"}') data`);
 await allowed('creator scope granted atomically',`select id from organizations where id='${org.data.id}'`);
 const [prog]=await allowed('create program in owned university',`select staff_create_master_record('program','{"title":"New Program","slug":"new-program","organization_id":"${org.data.id}"}') data`);
 await allowed('create course in owned program',`select staff_create_master_record('course','{"title":"New Course","slug":"new-course","organization_id":"${org.data.id}","program_id":"${prog.data.id}","payment_account_id":"${id(9)}"}') data`);
 await denied('forged enrollment price denied',`insert into enrollments(profile_id,course_id,price_snapshot,payment_timing,status) values('${id(3)}','${id(12)}',0,'upfront','pending_payment') returning id`);
 await allowed('deferred activation permitted',`update enrollments set status='active',activated_at=now() where id='${id(30)}' returning id`);
 await denied('price update denied',`update enrollments set price_snapshot=0 where id='${id(30)}' returning id`);
 await denied('expiry update denied',`update enrollments set expired_at=now()+interval '10 years' where id='${id(30)}' returning id`);
 await allowed('category update permitted',`update enrollments set category='separated' where id='${id(30)}' returning id`);
 await denied('scope self-assignment denied',`insert into leader_scopes(leader_id,course_id) values('${id(2)}','${id(22)}') returning id`);
 const payload=JSON.stringify({title:'Announcement',content:'Test only',all_students:false,is_published:true,starts_at:'2026-01-01T00:00:00Z',show_on_dashboard:true});
 await denied('ancestor-wide announcement denied',`select staff_save_announcement(null,'${payload}',array['${id(10)}']::uuid[],'{}')`);
 const [a]=await allowed('scoped announcement created',`select staff_save_announcement(null,'${payload}','{}',array['${id(12)}']::uuid[]) data`);
 await denied('out-of-scope target rejected atomically',`select staff_save_announcement('${a.data.id}','${payload.replace('Announcement','Changed')}', '{}',array['${id(22)}']::uuid[])`);
 assert.equal((await query(`select title from announcements where id='${a.data.id}'`))[0].title,'Announcement');tests++;console.log('PASS failed update preserves original');
 await allowed('own scoped announcement updated',`select staff_save_announcement('${a.data.id}','${payload.replace('Announcement','Changed')}', '{}',array['${id(12)}']::uuid[])`);

 await asUser(id(1));
 await db.exec(`reset role; insert into leader_scopes(leader_id,program_id) values('${id(5)}','${id(21)}'); insert into mentor_details(id,profile_id) values('${id(60)}','${id(4)}'); insert into course_mentors(course_id,mentor_id) values('${id(12)}','${id(60)}'); insert into enrollments(id,profile_id,course_id,price_snapshot,status,activated_at) values('${id(31)}','${id(3)}','${id(22)}',100000,'active',now());`);
 await asUser(id(2));
 await allowed('Leader reads Mentor directory with scoped courses',`select admin_get_mentor_directory()`);
 await allowed('Leader assigns Mentor to scoped course',`select admin_set_mentor_assignment('${id(4)}','${id(12)}',true)`);
 await denied('Leader cannot assign Mentor outside scope',`select admin_set_mentor_assignment('${id(4)}','${id(22)}',true)`);
 await allowed('Leader enables Mentor Rating in scoped course',`select admin_set_mentor_rating_enabled('${id(12)}',true)`);
 assert.equal((await query(`select mentor_rating_enabled from courses where id='${id(12)}'`))[0].mentor_rating_enabled,true);tests++;console.log('PASS scoped Mentor Rating toggle persisted');
 await denied('Leader cannot toggle Mentor Rating outside scope',`select admin_set_mentor_rating_enabled('${id(22)}',true)`);
 await allowed('Leader selects rated Mentors in scoped course',`select admin_set_course_rating_mentors('${id(12)}',array['${id(60)}']::uuid[])`);
 await denied('Leader cannot select rated Mentors outside scope',`select admin_set_course_rating_mentors('${id(22)}',array['${id(60)}']::uuid[])`);
 await allowed('Leader can create folder in scoped course',`insert into lesson_folders(id,course_id,slug,title,folder_order,publication_status) values('${id(70)}','${id(12)}','leader-folder','Leader Folder',1,'draft') returning id`);
 await denied('Leader cannot create folder outside scope',`insert into lesson_folders(id,course_id,slug,title,folder_order,publication_status) values('${id(71)}','${id(22)}','forbidden-folder','Forbidden Folder',1,'draft') returning id`);
 await allowed('Leader can create lesson in scoped course',`insert into lessons(id,course_id,folder_id,slug,title,lesson_order,duration,publication_status) values('${id(72)}','${id(12)}','${id(70)}','leader-lesson','Leader Lesson',1,1,'draft') returning id`);
 await denied('Leader cannot create lesson outside scope',`insert into lessons(id,course_id,slug,title,lesson_order,duration,publication_status) values('${id(73)}','${id(22)}','forbidden-lesson','Forbidden Lesson',1,1,'draft') returning id`);
 await allowed('Leader can create file in scoped lesson',`insert into lesson_files(id,lesson_id,title,file_type,file_path,file_order,publication_status) values('${id(74)}','${id(72)}','Leader File','pdf','gdrive:test',1,'draft') returning id`);
 await allowed('Leader can create video in scoped lesson',`insert into videos(id,lesson_id,title,provider,provider_video_id,duration,video_order,publication_status) values('${id(75)}','${id(72)}','Leader Video','youtube','test-video',1,1,'draft') returning id`);
 await allowed('Leader can create quiz in scoped lesson',`insert into quizzes(id,lesson_id,title,duration,quiz_order,publication_status) values('${id(76)}','${id(72)}','Leader Quiz',10,1,'draft') returning id`);
 await asUser(id(5));
 await allowed('program assignment includes child courses',`select id from courses where id='${id(22)}'`);
 await allowed('program assignment can create child course',`select staff_create_master_record('course','{"title":"Program Child","slug":"program-child","organization_id":"${id(20)}","program_id":"${id(21)}","payment_account_id":"${id(9)}"}')`);
 await denied('program scope cannot edit university',`update organizations set title='Not allowed' where id='${id(20)}' returning id`);
 await denied('another Leader cannot modify announcement',`select staff_save_announcement('${a.data.id}','${payload}', '{}',array['${id(22)}']::uuid[])`);
 await asUser(id(3));
 await allowed('student creates assigned thread',`insert into lesson_message_threads(id,student_profile_id,course_id) values('${id(40)}','${id(3)}','${id(12)}') returning id`);
 await allowed('student creates other thread',`insert into lesson_message_threads(id,student_profile_id,course_id) values('${id(41)}','${id(3)}','${id(22)}') returning id`);
 await allowed('student sends message',`insert into lesson_message_entries(thread_id,sender_profile_id,sender_role,message) values('${id(40)}','${id(3)}','student','Test question') returning id`);
 await asUser(id(2));
 await denied('out-of-scope thread hidden',`select id from lesson_message_threads where id='${id(41)}'`);
 await allowed('Leader sends scoped reply',`insert into lesson_message_entries(thread_id,sender_profile_id,sender_role,message) values('${id(40)}','${id(2)}','leader','Test reply') returning id`);
 assert.equal((await query(`select status from lesson_message_threads where id='${id(40)}'`))[0].status,'answered');tests++;console.log('PASS Leader reply marks thread answered');
 await denied('out-of-scope reply denied',`insert into lesson_message_entries(thread_id,sender_profile_id,sender_role,message) values('${id(41)}','${id(2)}','leader','Forbidden reply') returning id`);
 await denied('thread reassignment denied',`update lesson_message_threads set student_profile_id='${id(5)}' where id='${id(40)}' returning id`);
 await allowed('Leader closes thread',`update lesson_message_threads set status='closed' where id='${id(40)}' returning id`);
 await denied('closed thread reply denied',`insert into lesson_message_entries(thread_id,sender_profile_id,sender_role,message) values('${id(40)}','${id(2)}','leader','Forbidden reply') returning id`);
 await allowed('Leader reopens thread',`update lesson_message_threads set status='open' where id='${id(40)}' returning id`);
 await asUser(id(4));
 await allowed('assigned Mentor reply preserved',`insert into lesson_message_entries(thread_id,sender_profile_id,sender_role,message) values('${id(40)}','${id(4)}','mentor','Mentor reply') returning id`);
 await denied('Mentor cannot create master data',`select staff_create_master_record('organization','{"title":"Forbidden","short_name":"X","slug":"forbidden"}')`);
 await asUser(id(1));
 await db.exec(`update leader_permissions set enabled=false where leader_id='${id(2)}' and permission='manage_messages'`);
 await asUser(id(2));
 await denied('permission revocation hides inbox',`select id from lesson_message_threads where id='${id(40)}'`);
 await denied('permission revocation denies reply',`insert into lesson_message_entries(thread_id,sender_profile_id,sender_role,message) values('${id(40)}','${id(2)}','leader','Forbidden reply') returning id`);
 await asUser(id(1));
 await db.exec(`update leader_permissions set enabled=true where leader_id='${id(2)}' and permission='manage_messages'; update profiles set status='inactive' where id='${id(2)}';`);
 await asUser(id(2));
 await denied('inactive Leader has no scoped course access',`select id from courses where id='${id(12)}'`);
 await denied('inactive Leader cannot create',`select staff_create_master_record('organization','{"title":"Forbidden","short_name":"X","slug":"inactive-forbidden"}')`);
 await asUser(id(1));
 await db.exec(`update profiles set status='active' where id='${id(2)}'; insert into enrollments(id,profile_id,course_id,price_snapshot,status) values('${id(32)}','${id(5)}','${id(12)}',100000,'pending_payment');`);
 await asUser(id(2));
 await denied('upfront activation denied',`update enrollments set status='active',activated_at=now() where id='${id(32)}' returning id`);
 await denied('enrollment deletion denied',`delete from enrollments where id='${id(30)}' returning id`);
 await denied('Leader cannot read admin audit',`select id from leader_audit_events`);
 await asUser(id(1));
 await allowed('Admin reads audit events',`select id from leader_audit_events`);
 await db.exec(`delete from leader_scopes where leader_id='${id(2)}' and course_id='${id(12)}'`);
 await asUser(id(2));
 await denied('revocation immediately hides course',`select id from courses where id='${id(12)}'`);
 await denied('revocation immediately hides enrollment',`select id from enrollments where id='${id(30)}'`);
 await denied('revocation immediately hides student profile',`select id from profiles where id='${id(3)}'`);
 await denied('revocation immediately hides scoped Try Out',`select id from tryouts where id='${id(50)}'`);
 await denied('revocation immediately hides scoped folder',`select id from lesson_folders where id='${id(70)}'`);
 await denied('revocation immediately hides scoped lesson',`select id from lessons where id='${id(72)}'`);
 await denied('revocation immediately hides scoped file',`select id from lesson_files where id='${id(74)}'`);
 await denied('revocation immediately hides scoped video',`select id from videos where id='${id(75)}'`);
 await denied('revocation immediately hides scoped quiz',`select id from quizzes where id='${id(76)}'`);
 await asUser(id(3));
 await allowed('student enrollment preserved',`select id from enrollments where id='${id(30)}'`);
 await denied('student cannot change role',`update profiles set role='admin' where id='${id(3)}' returning id`);
 console.log(`${tests} access tests passed`);await db.close();
} catch(e){console.error('FAIL',e.message,e.code,e.query?.slice(0,600),e.where);process.exit(1)}
