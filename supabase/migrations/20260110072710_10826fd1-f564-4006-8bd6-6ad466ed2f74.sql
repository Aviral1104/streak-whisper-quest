-- Update the handle_new_user function to give new users 50 coins instead of 10000
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, coins)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    50
  );
  RETURN NEW;
END;
$$;

-- Give avi1234asthana@gmail.com 10000 credits
UPDATE public.profiles 
SET coins = 10000 
WHERE email = 'avi1234asthana@gmail.com';