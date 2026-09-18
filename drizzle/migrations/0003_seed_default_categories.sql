-- Seeds the default, global (household_id NULL) categories every
-- household starts with, matching the design doc §12 examples.
INSERT INTO "categories" ("name", "group") VALUES
  ('Rent', 'bills'),
  ('Utilities', 'bills'),
  ('Insurance', 'bills'),
  ('Student Loan', 'debt'),
  ('Groceries', 'expenses'),
  ('Dining Out', 'expenses'),
  ('Transport', 'expenses'),
  ('Healthcare', 'expenses'),
  ('Entertainment', 'expenses'),
  ('Shopping', 'expenses'),
  ('Other', 'expenses'),
  ('Emergency Fund', 'savings');
