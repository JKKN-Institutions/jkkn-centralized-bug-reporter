# SQL File Index

## File Organization

- **01_tables.sql** - All table definitions
- **02_functions.sql** - Database functions
- **03_policies.sql** - RLS policies
- **04_triggers.sql** - Database triggers
- **05_views.sql** - Database views

## Last Updated: 2025-11-03

## Tables
- organizations
- organization_members
- applications
- bug_reports (enhanced with org/app fields)
- bug_report_messages
- bug_report_participants
- bug_report_message_reads

## Views
- bug_reports_with_details
- bug_reporters_leaderboard_org (per-organization)
- application_stats

## Functions
- generate_bug_display_id() - Auto-generate bug IDs (BUG-001, BUG-002, etc.)
- generate_api_key() - Generate unique API keys for applications
- add_owner_to_org_members() - Auto-add organization owner to members
- update_updated_at_column() - Update timestamps on row changes

## Triggers
- set_bug_display_id - Auto-generate bug display IDs
- set_app_api_key - Auto-generate application API keys
- add_owner_after_org_create - Add owner to members table
- update_*_updated_at - Update timestamps on changes
