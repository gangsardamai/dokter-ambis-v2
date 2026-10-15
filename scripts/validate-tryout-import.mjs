#!/usr/bin/env node
// Dokter Ambis: deterministic pre-publication Try Out QA.
// Usage: node scripts/validate-tryout-import.mjs path/to/tryout.json
import fs from "node:fs";
const file = process.argv[2];
if (!file) { console.error("Usage: node scripts/validate-tryout-import.mjs <tryout.json>"); process.exit(2); }
const data = JSON.parse(fs.readFileSync(file, "utf8"));
const items = data.questions || [];
const errors = [], warnings = [], pictureNames = new Set();
if (!items.length) errors.push("No questions found");
items.forEach((q, i) => {
 const n = i + 1;
 if (q.order !== n) errors.push(`Question ${n}: order is ${q.order}`);
 if (!q.question?.trim()) errors.push(`Question ${n}: missing stem`);
 const options = q.options || [];
 if (options.length < 2 || options.length > 6) errors.push(`Question ${n}: invalid option count ${options.length}`);
 if (options.some(o => !o.text?.trim())) errors.push(`Question ${n}: empty answer option`);
 if (options.filter(o => o.is_correct === true).length !== 1) errors.push(`Question ${n}: expected exactly one answer key`);
 if (!q.explanation?.trim()) errors.push(`Question ${n}: missing explanation`);
 else if (q.explanation.trim().length < 30) warnings.push(`Question ${n}: very short explanation (manual review)`);
 const imgs = [...(q.question_images || []), ...(q.explanation_images || [])];
 for (const path of imgs) {
  if (pictureNames.has(path)) warnings.push(`Question ${n}: duplicate image reference ${path}`);
  pictureNames.add(path);
  if (data.images_dir && !fs.existsSync(data.images_dir + "/" + path.replace(/^images\//, ""))) errors.push(`Question ${n}: missing local image ${path}`);
 }
 if (/perhatikan (gambar|rekaman|gambaran) ekg/i.test(q.question) && !(q.question_images || []).length)
  errors.push(`Question ${n}: EKG explicitly referenced but no question image`);
});
const result = { total_questions: items.length, total_image_references: pictureNames.size, question_image_count: items.reduce((x,q)=>x+(q.question_images||[]).length,0), errors, warnings, ready_for_publication: errors.length===0 && warnings.length===0 };
console.log(JSON.stringify(result, null, 2));
if (!result.ready_for_publication) process.exit(1);
