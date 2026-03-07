@echo off
echo ========================================
echo VAT/WHT Migration Script
echo ========================================
echo.
echo This script will safely add VAT/WHT columns to your database
echo without losing any existing data.
echo.
echo WARNING: Make sure you have a backup of your database!
echo.
pause

echo.
echo Step 1: Connecting to database...
echo.

REM Get database URL from environment or use default
set DATABASE_URL=postgresql://grwofinance:grwofinance1706@localhost:5432/grwofinance

echo Running migration: 0007_add_vat_wht_columns_safe.sql
echo.

psql "%DATABASE_URL%" -f migrations/0007_add_vat_wht_columns_safe.sql

echo.
echo ========================================
echo Migration completed!
echo ========================================
echo.
echo Please verify the results above to ensure:
echo 1. No errors occurred
echo 2. Records were updated correctly
echo 3. VAT/WHT columns are now available
echo.
pause
