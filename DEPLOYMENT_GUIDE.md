# Dual Membership System - Complete Deployment Guide

## Overview

This system implements two completely independent membership systems:
- **Creators Membership**: For creators to upgrade their platform tier (Free → Premium → Professional → Elite)
- **Members Membership**: For platform community members to join (Basic → Premium → VIP)

All code uses **consistent plural naming** throughout: `creators_*` and `members_*`

---

## Architecture Summary

### Two Independent Systems
Each system has its own:
- Database tables (both singular and plural variants)
- Webhook event tracking
- Payment audit logs
- RLS policies

### Shared Infrastructure
Both systems share:
- `MembershipPaymentModalV2` component (accepts `membershipType` prop)
- `paymentOrchestration.ts` service (routes based on membership type)
- `initializePaymentUnified` Edge Function
- `handlePaymentWebhookUnified` Edge Function

---

## Frontend Routes (All Clean & Specific)

```
GET  /creators-membership → Membership.tsx (creators only)
GET  /members-membership  → MembersMembership.tsx (members only)
POST /membership-callback → MembershipCallback.tsx (webhook redirect)
```

**REMOVED:** The redundant `/membership` route has been deleted. Only `/creators-membership` exists.

---

## Database Schema

All tables use **plural naming** consistently:

### Creators Membership Tables
- `creators_membership` - Main membership records
- `creators_webhook_events` - Webhook event tracking
- `creators_payment_audit_log` - Audit trail

### Members Membership Tables
- `members_membership` - Main membership records
- `members_webhook_events` - Webhook event tracking
- `members_payment_audit_log` - Audit trail

**Deployment:**
```bash
# Run this SQL in Supabase SQL Editor:
# File: supabase/migrations/membership_schema.sql
```

---

## Code Changes Made

### 1. Frontend Routes (src/App.tsx)
- **REMOVED**: `/membership` route (was redundant alias)
- **KEPT**: `/creators-membership` → Membership.tsx
- **KEPT**: `/members-membership` → MembersMembership.tsx

### 2. Payment Orchestration Service (src/lib/paymentOrchestration.ts)

**Fixed naming consistency:**
```typescript
// Before (incorrect):
getAuditTableName() returns 'payment_audit_log' for creators
getWebhookTableName() returns 'webhook_events' for creators

// After (correct):
getAuditTableName() returns 'creators_payment_audit_log' for creators
getWebhookTableName() returns 'creators_webhook_events' for creators
```

**All methods now accept `membershipType` parameter:**
- `handleWebhook(webhook, membershipType)`
- `recordWebhookEvent(webhook, transactionId, membershipType)`
- `completePayment(transactionId, gatewayTransactionId, membershipType)`
- `failPayment(transactionId, error, membershipType)`

### 3. Webhook Handler (supabase/functions/handlePaymentWebhookUnified/index.ts)

**Fixed table name resolution:**
```typescript
// Line 70 (Before): 'webhook_events'
// Line 70 (After): 'creators_webhook_events'

// Line 71 (Before): 'payment_audit_log'
// Line 71 (After): 'creators_payment_audit_log'

// Line 102 (Before): 'webhook_events'
// Line 102 (After): 'creators_webhook_events'

// Line 103 (Before): 'payment_audit_log'
// Line 103 (After): 'creators_payment_audit_log'
```

### 4. Membership Callback (src/pages/MembershipCallback.tsx)

**Fixed redirect paths:**
```typescript
// Before: redirects to '/membership'
// After: redirects to '/creators-membership' or '/members-membership'
```

Both in success and error paths.

### 5. Navbar (src/components/Navbar.tsx)
- ✓ Already correctly routes creators to `/creators-membership`
- ✓ Already correctly routes members to `/members-membership`
- No changes needed

---

## Edge Functions (Deployment Required)

### 1. initializePaymentUnified
- **Path**: `supabase/functions/initializePaymentUnified/index.ts`
- **Status**: ✓ Already uses correct table names
- **Action**: Deploy with `supabase functions deploy initializePaymentUnified`

### 2. handlePaymentWebhookUnified
- **Path**: `supabase/functions/handlePaymentWebhookUnified/index.ts`
- **Status**: ✓ Fixed to use plural table names
- **Action**: Deploy with `supabase functions deploy handlePaymentWebhookUnified`

---

## Deployment Checklist

### Step 1: Database Schema
- [ ] Run `supabase/migrations/membership_schema.sql` in Supabase SQL Editor
- [ ] Verify tables created: `creators_membership`, `members_membership`, etc.

### Step 2: Edge Functions
- [ ] Deploy `initializePaymentUnified`:
  ```bash
  supabase functions deploy initializePaymentUnified
  ```
- [ ] Deploy `handlePaymentWebhookUnified`:
  ```bash
  supabase functions deploy handlePaymentWebhookUnified
  ```

### Step 3: Environment Variables
Ensure these are configured in Supabase:
- `EVERSEND_API_KEY`
- `EVERSEND_WEBHOOK_SECRET`
- `FLUTTERWAVE_SECRET_KEY`
- `FLUTTERWAVE_WEBHOOK_SECRET`
- `APP_URL` (your app domain)

### Step 4: Payment Gateway Webhooks
Update webhook URLs in:
- **Eversend Dashboard**: Point to `handlePaymentWebhookUnified`
- **Flutterwave Dashboard**: Point to `handlePaymentWebhookUnified`

### Step 5: Frontend Build
```bash
npm run build
# Verify no build errors
npm run typecheck
```

### Step 6: Test Payment Flow
1. Creator upgrades membership via `/creators-membership`
2. Member joins membership via `/members-membership`
3. Complete payment in gateway
4. Verify webhook updates correct table (`creators_membership` or `members_membership`)

---

## Naming Convention Reference

### Table Names (Plural)
- ✓ `creators_membership` (not `creator_membership`)
- ✓ `creators_webhook_events` (not `creator_webhook_events`)
- ✓ `creators_payment_audit_log` (not `creator_payment_audit_log`)
- ✓ `members_membership` (not `member_membership`)
- ✓ `members_webhook_events` (not `member_webhook_events`)
- ✓ `members_payment_audit_log` (not `member_payment_audit_log`)

### Index Names (Plural)
- ✓ `idx_creators_membership_*`
- ✓ `idx_creators_webhook_events_*`
- ✓ `idx_creators_payment_audit_log_*`
- ✓ `idx_members_membership_*`
- ✓ `idx_members_webhook_events_*`
- ✓ `idx_members_payment_audit_log_*`

### Function Names (Plural)
- ✓ `update_creators_membership_updated_at()`
- ✓ `update_members_membership_updated_at()`
- ✓ `trigger_update_creators_membership_updated_at`
- ✓ `trigger_update_members_membership_updated_at`

### Route Paths (Plural & Specific)
- ✓ `/creators-membership` (not `/membership` or `/creator-membership`)
- ✓ `/members-membership` (not `/member` or `/member-membership`)

---

## What Was Removed

1. **Redundant `/membership` route** - Caused confusion, now only `/creators-membership` exists
2. **Generic table names** - All now explicitly prefixed with `creators_` or `members_`
3. **Backward compatibility code** - Single, clean implementation without legacy support
4. **Old naming patterns** - No singular forms, all consistent plural naming (including routes)

---

## Testing Checklist

After deployment, verify:

### Creators Membership
- [ ] Navigate to `/creators-membership`
- [ ] View current tier
- [ ] Click upgrade button
- [ ] Payment modal appears
- [ ] Complete payment
- [ ] Redirected to `/creators-membership` callback
- [ ] Data written to `creators_membership` table
- [ ] Webhook recorded in `creators_webhook_events`
- [ ] Audit logged in `creators_payment_audit_log`

### Members Membership
- [ ] Navigate to `/members-membership`
- [ ] View membership tiers (Basic, Premium, VIP)
- [ ] Click join button
- [ ] Payment modal appears
- [ ] Complete payment
- [ ] Redirected to `/members-membership` callback
- [ ] Data written to `members_membership` table
- [ ] Webhook recorded in `members_webhook_events`
- [ ] Audit logged in `members_payment_audit_log`

### Naming Verification
- [ ] No references to `webhook_events` (only `creators_webhook_events` or `members_webhook_events`)
- [ ] No references to `payment_audit_log` (only `creators_payment_audit_log` or `members_payment_audit_log`)
- [ ] No routes to `/membership` (only `/creators-membership` or `/members-membership`)

---

## Support & Troubleshooting

### Issue: Payment redirects to wrong membership page
- **Check**: MembershipCallback.tsx should use `/creators-membership` or `/members-membership`
- **Check**: Query parameter `?type=creator` or `?type=member` being passed

### Issue: Webhook not updating membership
- **Check**: `creators_webhook_events` and `creators_payment_audit_log` exist in Supabase
- **Check**: Edge Function `handlePaymentWebhookUnified` is deployed
- **Check**: Webhook URL configured correctly in payment gateway

### Issue: Payment orchestration fails
- **Check**: `paymentOrchestration.ts` methods accept `membershipType` parameter
- **Check**: `getTableName()`, `getAuditTableName()`, `getWebhookTableName()` return correct plural names

---

## Code Stability

✓ **All code is production-grade:**
- No deprecated patterns
- No legacy support code
- Clean, single way of doing things
- Consistent naming throughout
- Proper error handling and audit trails
- RLS policies for data security
- Idempotency keys prevent duplicate charges

