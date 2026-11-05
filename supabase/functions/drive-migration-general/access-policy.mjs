// Shared, pure access policy for Drive copy preflight and postflight.
// Ignore ownership entries: a successful copy necessarily changes owner.
const permKey = p => [
  p.type ?? "", p.role ?? "", (p.emailAddress ?? "").toLowerCase(),
  (p.domain ?? "").toLowerCase(), String(p.allowFileDiscovery ?? "")
].join("|");
const normalized = perms => {
  if (!Array.isArray(perms) || perms.length===0) throw Error("missing_acl");
  return perms.filter(p => p.role !== "owner" && !p.deleted).map(permKey).sort();
};
const publicEntries = perms => normalized(perms).filter(s => s.startsWith("anyone|"));

export function copyAllowedByParent(sourcePerms, parentPerms) {
  // Same-parent copies inherit parent permissions; distinct direct grants require
  // an explicit equivalence proof, unless everyone already has the same access.
  const src = normalized(sourcePerms), parent = normalized(parentPerms);
  if (JSON.stringify(src) === JSON.stringify(parent)) return true;
  const sPublic=publicEntries(sourcePerms), pPublic=publicEntries(parentPerms);
  return sPublic.length===1 && JSON.stringify(sPublic)===JSON.stringify(pPublic);
}
export function effectiveAccessEquivalent(sourcePerms, copyPerms) {
  const src=normalized(sourcePerms), cp=normalized(copyPerms);
  if(JSON.stringify(src)===JSON.stringify(cp)) return true;
  const sPublic=publicEntries(sourcePerms), cPublic=publicEntries(copyPerms);
  // A matching everyone permission dominates narrower individual grants.
  return sPublic.length===1 && JSON.stringify(sPublic)===JSON.stringify(cPublic);
}
