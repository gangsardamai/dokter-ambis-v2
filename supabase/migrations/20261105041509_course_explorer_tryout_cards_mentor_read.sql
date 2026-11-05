-- Allow active assigned mentors to see lightweight Try Out cards for their course.
-- Mutations remain under their existing, stricter owner/scope policies.
-- Question, option, result and answer RLS policies remain unchanged.
CREATE POLICY tryouts_assigned_mentor_course_read
ON public.tryouts
FOR SELECT TO authenticated
USING (
  (SELECT public.current_profile_role()) = 'mentor'::public.profile_role
  AND public.is_assigned_mentor((SELECT auth.uid()), course_id)
);
