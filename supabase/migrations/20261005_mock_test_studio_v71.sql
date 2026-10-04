-- HOA Mock Test Studio V7.1
-- Keep legacy test_type values and align the production save_test_bundle_v3 contract
-- with the dedicated Full-Length folder type.
alter table public.tests drop constraint if exists tests_test_type_check;
alter table public.tests
  add constraint tests_test_type_check
  check (test_type = any (array[
    'subject'::text,
    'full'::text,
    'full_length'::text,
    'sectional'::text,
    'practice'::text,
    'previous_year'::text
  ]));
