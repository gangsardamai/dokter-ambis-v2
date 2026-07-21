-- =========================================================
-- DOKTER AMBIS
-- Migration : 0030
-- File      : 0030_create_profile_trigger.sql
-- Purpose   : Automatically create profile after auth signup
-- =========================================================

-- =========================================================
-- 1. Create Function
-- =========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()

RETURNS TRIGGER

LANGUAGE plpgsql

SECURITY DEFINER

SET search_path = public

AS $$

BEGIN

    INSERT INTO public.profiles (

        id,

        full_name,

        phone,

        role,

        status

    )

    VALUES (

        NEW.id,

        COALESCE(

            NEW.raw_user_meta_data->>'full_name',

            'Mahasiswa'

        ),

        COALESCE(

            NEW.raw_user_meta_data->>'phone',

            CONCAT(
                'TEMP-',
                SUBSTRING(
                    NEW.id::text,
                    1,
                    8
                )
            )

        ),

        'student',

        'active'

    );

    RETURN NEW;

END;

$$;

-- =========================================================
-- 2. Trigger
-- =========================================================

DROP TRIGGER IF EXISTS on_auth_user_created

ON auth.users;

CREATE TRIGGER on_auth_user_created

AFTER INSERT

ON auth.users

FOR EACH ROW

EXECUTE FUNCTION public.handle_new_user();