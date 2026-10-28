import assert from 'node:assert/strict';
import {parseTryoutForm} from '../../lib/forms/tryout.ts';
import {db, asUser, id} from './seed.mjs';

await asUser(id(1));
await db.exec(`update enrollments set status='active' where id='${id(30)}'`);
for (const shuffleQuestions of [false, true]) {
  for (const shuffleOptions of [false, true]) {
    const form = new FormData();
    for (const [key, value] of Object.entries({courseId:id(12),title:'Shuffle regression',durationMinutes:'120',maxAttempts:'2',passingScore:'70',resultReleaseMode:'immediate',reviewReleaseMode:'immediate',publicationStatus:'published'})) form.set(key,value);
    if (shuffleQuestions) form.set('shuffleQuestions','on');
    if (shuffleOptions) form.set('shuffleOptions','on');
    const parsed = parseTryoutForm(form);
    assert.equal(parsed.shuffleQuestions, shuffleQuestions);
    assert.equal(parsed.shuffleOptions, shuffleOptions);
    const base = 100 + Number(shuffleQuestions)*100 + Number(shuffleOptions)*50;
    await asUser(id(1));
    await db.exec(`insert into tryouts(id,course_id,title,created_by,publication_status,review_release_mode,shuffle_questions,shuffle_options) values('${id(base)}','${id(12)}','Shuffle regression','${id(1)}','published','immediate',${parsed.shuffleQuestions},${parsed.shuffleOptions});`);
    await db.exec('reset role; begin');
    const questions = [];
    const options = {};
    for (let n=1;n<=12;n++) {
      const questionId=id(base*100+n);
      questions.push(questionId);
      options[questionId]=[];
      await db.exec(`insert into tryout_questions(id,tryout_id,question_order,question) values('${questionId}','${id(base)}',${n},'Question ${n}');`);
      for (let o=1;o<=5;o++) {
        const optionId=id(base*10000+n*10+o);
        options[questionId].push(optionId);
        await db.exec(`insert into tryout_options(id,question_id,option_order,option_text,is_correct) values('${optionId}','${questionId}',${o},'Option ${o}',${o===1});`);
      }
    }
    await db.exec('commit');
    await asUser(id(3));
    // Fixed seed makes random-order expectations reproducible.
    await db.query('select setseed(0.42)');
    const started=(await db.query('select start_tryout_attempt($1) data',[id(base)])).rows[0].data;
    const attempt=(await db.query('select question_order,option_orders from tryout_attempts where id=$1',[started.attempt_id])).rows[0];
    assert.deepEqual([...attempt.question_order].sort(),[...questions].sort());
    if(shuffleQuestions) assert.notDeepEqual(attempt.question_order,questions);
    else assert.deepEqual(attempt.question_order,questions);
    let changedOptions=false;
    for(const questionId of questions) {
      assert.deepEqual([...attempt.option_orders[questionId]].sort(),[...options[questionId]].sort());
      if(JSON.stringify(attempt.option_orders[questionId])!==JSON.stringify(options[questionId])) changedOptions=true;
      if(!shuffleOptions) assert.deepEqual(attempt.option_orders[questionId],options[questionId]);
    }
    assert.equal(changedOptions,shuffleOptions);
    const resumed=(await db.query('select start_tryout_attempt($1) data',[id(base)])).rows[0].data;
    assert.equal(resumed.attempt_id,started.attempt_id);
    assert.equal(resumed.resumed,true);
  }
}
console.log('PASS all four shuffle combinations, ordered A–E, complete question/option sets, and stable resumed attempts');
await db.close();
