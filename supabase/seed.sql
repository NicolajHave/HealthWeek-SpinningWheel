-- Health Week — team list and PINs.
--
-- The PINs are committed here, so they are convenience and not security. The
-- real control is the unique constraint on hw_spins.team_id.
--
-- Rules the PINs follow: 4 digits, unique, no leading zero, at least three
-- distinct digits, no run of three ascending or descending, nothing that reads
-- as a year, and no two teams sharing their first two digits — so they survive
-- being read out loud.
--
-- Replacing the list? Clear the old one first; hw_spins cascades:
--   delete from hw_teams;

insert into hw_teams (name, pin, sort_order) values
  ('Selected Finance + Business Development', '1703', 1),
  ('People + Management', '7266', 2),
  ('Sustainability + Sourcing + Direct', '3607', 3),
  ('Buying Knit + Jersey', '2778', 4),
  ('Buying Tailoring', '7054', 5),
  ('Buying Accessories + Shoes', '9264', 6),
  ('Buying Jeans + Pants', '4952', 7),
  ('Buying Outerwear + Leather', '8175', 8),
  ('Buying Woven', '9763', 9),
  ('Buying Process + Søren & Anders', '5072', 10),
  ('Sales Support', '3835', 11),
  ('Sales Region South + DACH', '5404', 12),
  ('Sales Region North/West + ROW + Benelux', '9856', 13),
  ('Design Women', '8427', 14),
  ('Design Men', '7830', 15),
  ('Pattern Design', '9693', 16),
  ('B2B Communications', '7636', 17),
  ('Omni Buying', '3095', 18),
  ('E-com', '8939', 19),
  ('Retail', '3985', 20),
  ('BS Finance', '8805', 21)
on conflict (pin) do nothing;
