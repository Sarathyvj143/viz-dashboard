# Backend Scripts & Migrations

## Database Migrations (PRIMARY METHOD)

For all new deployments and development environments:

```bash
# Run all migrations (includes workspace setup)
cd backend
alembic upgrade head
```

This will:
1. Create workspace schema (Migration 001)
2. Create default workspace and migrate existing data (Migration 002)
3. Set up workspace isolation and constraints

## User Registration (Automatic Workspace Creation)

New users automatically get their own workspace via `/api/auth/register`:
- Creates user account
- Creates personal workspace ("{username}'s Workspace")
- Adds user as admin of their workspace
- Sets as current workspace

No manual intervention needed.

## Migration vs. Manual Setup Decision Tree

```
Do you have an existing database?
├─ NO → Run `alembic upgrade head` (fresh install)
└─ YES
   ├─ Can you run Alembic migrations?
   │  ├─ YES → Run `alembic upgrade head`
   │  └─ NO → Contact development team for assistance
   └─ Already ran Migration 002?
      ├─ YES → Nothing to do
      └─ NO → Run `alembic upgrade head`
```

## Verifying Workspace Setup

```bash
# Check if migrations are current
alembic current

# Verify default workspace exists (if users existed before migration)
sqlite3 app_metadata.db "SELECT * FROM workspaces WHERE slug='default';"

# Check user workspace assignments
sqlite3 app_metadata.db "SELECT u.username, w.name FROM users u LEFT JOIN workspaces w ON u.current_workspace_id = w.id;"

# Verify no orphaned users
sqlite3 app_metadata.db "SELECT COUNT(*) FROM users WHERE current_workspace_id IS NULL;"
# Should return 0
```

## Migration Behavior

### Fresh Database (No Users)
- Migration 002 completes successfully without creating default workspace
- First user registration creates their personal workspace
- Subsequent users create their own workspaces

### Existing Database (With Users)
- Migration 002 creates "Default Workspace" with slug 'default'
- All existing users assigned to default workspace as admins
- All existing dashboards, connections, etc. assigned to default workspace
- Users can create additional workspaces after migration

## Rollback Plan

```bash
# Rollback migrations
alembic downgrade -1

# Restore backup if needed
cp app_metadata.db.backup app_metadata.db
```

## Deployment Checklist

### Pre-Deployment
- [ ] Backup current database: `cp app_metadata.db app_metadata.db.backup`
- [ ] Verify alembic current version: `alembic current`
- [ ] Check for orphaned data (see Verifying Workspace Setup above)

### Deployment
- [ ] Run migrations: `alembic upgrade head`
- [ ] Verify workspace count matches expectations
- [ ] Verify all users have workspace assignments
- [ ] Test login and dashboard access

### Post-Deployment
- [ ] Monitor logs for workspace-related errors
- [ ] Verify workspace isolation (users can't see other workspaces' data)
- [ ] Test workspace creation/invitation flow

## Troubleshooting

### Issue: Users without workspace assignments
**Symptoms:** 400 Bad Request errors on API endpoints

**Diagnosis:**
```bash
sqlite3 app_metadata.db "SELECT id, username, current_workspace_id FROM users WHERE current_workspace_id IS NULL;"
```

**Solution:** This should not occur if migrations ran correctly. Contact development team if this happens.

### Issue: Migration 002 not running
**Symptoms:** Alembic shows migration 002 as current, but no workspaces exist

**Diagnosis:**
```bash
alembic current  # Should show: 002 (head)
sqlite3 app_metadata.db "SELECT COUNT(*) FROM workspaces;"  # Should show > 0 if users existed
```

**Solution:** If users existed before migration but no workspaces were created, the migration may have encountered an error. Check migration logs.

### Issue: Duplicate workspace slugs
**Symptoms:** Workspace creation fails with slug conflict

**Diagnosis:**
```bash
sqlite3 app_metadata.db "SELECT slug, COUNT(*) FROM workspaces GROUP BY slug HAVING COUNT(*) > 1;"
```

**Solution:** This indicates data corruption. Contact development team.
