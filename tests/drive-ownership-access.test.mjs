import test from "node:test";
import assert from "node:assert/strict";
import {copyAllowedByParent,effectiveAccessEquivalent} from "../supabase/functions/drive-migration-general/access-policy.mjs";

const anyone = role => ({type:"anyone",role,allowFileDiscovery:false});
const user = (email,role="reader") => ({type:"user",emailAddress:email,role});
test("pilot: individualized shares and matching inherited anyone-writer remain accessible",()=>{
  const source=[anyone("writer"),user("original@example.invalid","owner"),user("student@example.invalid")];
  const parent=[anyone("writer"),user("main@example.invalid","owner")];
  const copy=[anyone("writer"),user("main@example.invalid","owner")];
  assert.equal(copyAllowedByParent(source,parent),true);
  assert.equal(effectiveAccessEquivalent(source,copy),true);
});
test("private direct student grants cannot be lost",()=>{
  const source=[user("owner@example.invalid","owner"),user("student@example.invalid")];
  const parent=[user("main@example.invalid","owner")];
  assert.equal(copyAllowedByParent(source,parent),false);
});
test("exact inherited grants are allowed",()=>{
  const inherited=[user("team@example.invalid","reader"),user("main@example.invalid","owner")];
  assert.equal(copyAllowedByParent(inherited,inherited),true);
  assert.equal(effectiveAccessEquivalent(inherited,[user("team@example.invalid","reader"),user("second@example.invalid","owner")]),true);
});
test("public writer -> public reader is not equivalent",()=>{
  assert.equal(effectiveAccessEquivalent([anyone("writer")],[anyone("reader")]),false);
});
test("no ACL data must fail closed",()=>{
  assert.throws(()=>copyAllowedByParent([],[anyone("reader")]),/missing_acl/);
});
