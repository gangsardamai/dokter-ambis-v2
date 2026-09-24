import assert from 'node:assert/strict';
import {getRoleDashboard} from '../../lib/auth/role-dashboard.ts';
import {isAdminConsoleRole} from '../../lib/auth/role-access.ts';
for(const [role,path] of [['admin','/dashboard/admin'],['leader','/dashboard/admin'],['mentor','/dashboard/mentor'],['student','/dashboard/student'],['unknown','/login']]) {
 assert.equal(getRoleDashboard(role),path);console.log(`PASS login destination: ${role}`);
}
for(const [role,allowed] of [['admin',true],['leader',true],['mentor',false],['student',false],['unknown',false]]) {
 assert.equal(isAdminConsoleRole(role),allowed);console.log(`PASS admin console access: ${role}`);
}
