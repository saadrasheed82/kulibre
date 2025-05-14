# Team Management Guide

This guide explains how to use the Team Management feature and how to deploy the Edge Function for full functionality.

## Current Implementation

The Team Management feature currently works in two modes:

1. **Temporary Mode (Default)**: When you add or invite team members, they are added to the local state and will be visible until you refresh the page. This is because we can't create users in the Supabase Auth system without the Edge Function.

2. **Permanent Mode (Requires Edge Function)**: When the Edge Function is deployed, team members are properly created in the Supabase Auth system and will persist even after page refreshes.

## Using Team Management

### Adding Team Members

1. Click the "Add Member" button
2. Fill in the member details
3. Click "Add Member"

If the Edge Function is not deployed, you'll see a message indicating that the member is temporary and will disappear on page refresh.

### Inviting Team Members

1. Click the "Invite" button
2. Enter the email and role
3. Click "Send Invite"

If the Edge Function is not deployed, you'll see a message indicating that the invitation is temporary and will disappear on page refresh.

## Deploying the Edge Function

To enable permanent team members, you need to deploy the Edge Function:

### Prerequisites

1. Supabase CLI installed
2. Access to your Supabase project
3. Supabase service role key

### Deployment Steps

1. **Install the Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link Your Project**:
   ```bash
   cd your-project-directory
   supabase link --project-ref your-project-ref
   ```

4. **Deploy the Function**:
   ```bash
   supabase functions deploy create-team-user
   ```

5. **Set Environment Variables**:
   - Go to your Supabase dashboard
   - Navigate to Settings > API
   - Find your project URL and service role key
   - Go to Functions > create-team-user
   - Add the following environment variables:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

## Troubleshooting

### Foreign Key Constraint Error

If you see an error like:
```
Failed to add team member: Error: Failed to create user: Failed to create profile: insert or update on table "profiles" violates foreign key constraint "profiles_id_fkey"
```

This means you're trying to create a profile without a corresponding user in the `auth.users` table. This is expected behavior when the Edge Function is not deployed, and the application will fall back to creating a temporary user.

### Edge Function Not Found

If you get a "Function not found" error after deploying:

1. Make sure the function is deployed correctly
2. Check that the function name is exactly `create-team-user`
3. Verify that the Supabase URL in your environment variables is correct

### Authorization Issues

If you get authorization errors:

1. Make sure you're logged in to the application
2. Verify that your user has admin privileges
3. Check that the service role key is set correctly in the Edge Function environment variables

## Next Steps

1. Deploy the Edge Function for permanent team members
2. Implement email sending functionality for invitations
3. Create an invitation acceptance flow
4. Add more detailed error handling and validation# Team Management Guide

This guide explains how to use the Team Management feature and how to deploy the Edge Function for full functionality.

## Current Implementation

The Team Management feature currently works in two modes:

1. **Temporary Mode (Default)**: When you add or invite team members, they are added to the local state and will be visible until you refresh the page. This is because we can't create users in the Supabase Auth system without the Edge Function.

2. **Permanent Mode (Requires Edge Function)**: When the Edge Function is deployed, team members are properly created in the Supabase Auth system and will persist even after page refreshes.

## Using Team Management

### Adding Team Members

1. Click the "Add Member" button
2. Fill in the member details
3. Click "Add Member"

If the Edge Function is not deployed, you'll see a message indicating that the member is temporary and will disappear on page refresh.

### Inviting Team Members

1. Click the "Invite" button
2. Enter the email and role
3. Click "Send Invite"

If the Edge Function is not deployed, you'll see a message indicating that the invitation is temporary and will disappear on page refresh.

## Deploying the Edge Function

To enable permanent team members, you need to deploy the Edge Function:

### Prerequisites

1. Supabase CLI installed
2. Access to your Supabase project
3. Supabase service role key

### Deployment Steps

1. **Install the Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link Your Project**:
   ```bash
   cd your-project-directory
   supabase link --project-ref your-project-ref
   ```

4. **Deploy the Function**:
   ```bash
   supabase functions deploy create-team-user
   ```

5. **Set Environment Variables**:
   - Go to your Supabase dashboard
   - Navigate to Settings > API
   - Find your project URL and service role key
   - Go to Functions > create-team-user
   - Add the following environment variables:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

## Troubleshooting

### Foreign Key Constraint Error

If you see an error like:
```
Failed to add team member: Error: Failed to create user: Failed to create profile: insert or update on table "profiles" violates foreign key constraint "profiles_id_fkey"
```

This means you're trying to create a profile without a corresponding user in the `auth.users` table. This is expected behavior when the Edge Function is not deployed, and the application will fall back to creating a temporary user.

### Edge Function Not Found

If you get a "Function not found" error after deploying:

1. Make sure the function is deployed correctly
2. Check that the function name is exactly `create-team-user`
3. Verify that the Supabase URL in your environment variables is correct

### Authorization Issues

If you get authorization errors:

1. Make sure you're logged in to the application
2. Verify that your user has admin privileges
3. Check that the service role key is set correctly in the Edge Function environment variables

## Next Steps

1. Deploy the Edge Function for permanent team members
2. Implement email sending functionality for invitations
3. Create an invitation acceptance flow
4. Add more detailed error handling and validation