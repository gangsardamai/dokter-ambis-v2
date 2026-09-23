import assert from 'node:assert/strict';
import {getRoleDashboard} from '../../lib/auth/role-dashboard.ts';
for(const [role,path] of [['admin','/dashboard/admin'],['leader','/dashboard/admin'],['mentor','/dashboard/mentor'],['student','/dashboard/student'],['unknown','/login']]) {
 assert.equal(getRoleDashboard(role),path);console.log(`PASS login destination: ${role}`);
}
