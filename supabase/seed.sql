-- Health Week — team list and PINs.
--
-- TODO BEFORE THE EVENT: replace these placeholder department names with the
-- real team list. PINs are 4 digits, unique, no leading zero and no confusable
-- runs (no 0000, no 1234, no repeated or sequential digits). If you change the
-- team list, generate new PINs with the same rules.
--
-- The PINs below are published in this repository, so they are convenience, not
-- security. Regenerate them before the event if that bothers you.

insert into teams (name, pin, sort_order) values
  ('Finance',         '2748',  1),
  ('HR & People',     '3591',  2),
  ('IT',              '4826',  3),
  ('Legal',           '5173',  4),
  ('Logistics',       '6942',  5),
  ('Marketing',       '7364',  6),
  ('Merchandising',   '8215',  7),
  ('Product Design',  '9537',  8),
  ('Purchasing',      '2963',  9),
  ('Retail Ops',      '3847', 10),
  ('Sales',           '4519', 11),
  ('Supply Chain',    '5628', 12),
  ('Sustainability',  '7132', 13),
  ('Wholesale',       '8459', 14)
on conflict (pin) do nothing;
