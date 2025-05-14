# Deploying the Create Team User Edge Function

This guide explains how to deploy the Create Team User Edge Function to your Supabase project.

## Prerequisites

1. Supabase CLI installed
2. Access to your Supabase project
3. Supabase service role key

## Deployment Steps

### 1. Install the Supabase CLI

If you haven't already installed the Supabase CLI, you can do so with:

```bash
# Using npm
npm install -g supabase

# Using yarn
yarn global add supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

Navigate to your project root directory and link your Supabase project:

```bash
cd your-project-directory
supabase link --project-ref your-project-ref
```

Replace `your-project-ref` with your Supabase project reference ID.

### 4. Deploy the Function

```bash
supabase functions deploy create-team-user
```

### 5. Set Environment Variables

You need to set the following environment variables for the function to work properly:

1. Go to your Supabase dashboard
2. Navigate to Settings > API
3. Find your project URL and service role key
4. Go to Functions > create-team-user
5. Add the following environment variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### 6. Test the Function

You can test the function using the test file provided in `src/lib/services/team-service.test.ts`.

## Troubleshooting

### Function Returns 500 Error

If the function returns a 500 error, check the following:

1. Make sure the environment variables are set correctly
2. Check the function logs in the Supabase dashboard
3. Verify that the user making the request has admin privileges

### Function Not Found

If you get a "Function not found" error, make sure:

1. The function is deployed correctly
2. You're using the correct URL for the function
3. The function name matches exactly (case-sensitive)

### Authorization Issues

If you get authorization errors:

1. Make sure the user making the request is authenticated
2. Verify that the user has admin privileges
3. Check that the Authorization header is being sent correctly

## Fallback Mechanism

If the Edge Function is not available or fails, the application will automatically fall back to client-side user creation. This ensures that the team management functionality continues to work even if there are issues with the Edge Function.

## Updating the Function

To update the function after making changes:

```bash
supabase functions deploy create-team-user
```

This will deploy the updated version of the function to your Supabase project.