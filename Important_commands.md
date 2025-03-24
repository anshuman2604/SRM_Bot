to make a new user admin
select set_admin_role('anshumang2604@gmail.com')

to revoke admin

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"user"')
WHERE email = 'user@example.com'; -- replace with the user's email