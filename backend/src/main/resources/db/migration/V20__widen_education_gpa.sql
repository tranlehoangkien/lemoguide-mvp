-- DECIMAL(3,2) tops out at 9.99, but Vietnamese schools grade on a 10-point scale
-- where a perfect GPA of 10.00 is valid. Saving such a row threw a DB overflow
-- error that silently dropped the whole education entry (see ProfileImportService).
ALTER TABLE education MODIFY COLUMN gpa DECIMAL(4, 2) NULL;
