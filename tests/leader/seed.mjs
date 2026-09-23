import {db,asUser} from './load.mjs';
export {db,asUser};
export const id=n=>'10000000-0000-4000-8000-'+String(n).padStart(12,'0');
for(const [n,role] of [[1,'admin'],[2,'leader'],[3,'student'],[4,'mentor'],[5,'leader']]){
 await db.exec(`insert into auth.users values('${id(n)}'); insert into profiles(id,full_name,phone,role) values('${id(n)}','Test ${role}','08123456780${n}','${role}');`);
}
await asUser(id(1));
await db.exec(`insert into payment_accounts(id,label,bank_name,account_number,account_holder_name) values('${id(9)}','Test','Test','1234567890','Test');`);
for(const n of [10,20]){
 await db.exec(`insert into organizations(id,title,short_name,slug) values('${id(n)}','Test University ${n}','U${n}','test-university-${n}'); insert into programs(id,title,slug,organization_id,status) values('${id(n+1)}','Test Program ${n}','test-program-${n}','${id(n)}','active');`);
 for(const d of [2,3])await db.exec(`insert into courses(id,title,slug,organization_id,program_id,status,price,payment_account_id,payment_policy) values('${id(n+d)}','Test Course ${n+d}','test-course-${n+d}','${id(n)}','${id(n+1)}','active',100000,'${id(9)}','upfront_or_deferred');`);
}
await db.exec(`insert into leader_scopes(leader_id,course_id,created_by) values('${id(2)}','${id(12)}','${id(1)}'); insert into enrollments(id,profile_id,course_id,price_snapshot,payment_timing,status) values('${id(30)}','${id(3)}','${id(12)}',100000,'deferred','pending_approval');`);
await asUser(id(2));
