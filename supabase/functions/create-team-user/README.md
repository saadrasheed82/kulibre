# Create Team User Edge Function

This Supabase Edge Function allows you to create users in the Supabase auth system directly from the Team page.

## Features

- Creates a new user in Supabase Auth
- Automatically confirms the user's email
- Sets up the user's profile with the provided information
- Assigns the user to a team if specified
- Creates an invitation record
- Returns a generated password for the new user

## Security

- Only authenticated users can call this function
- Only users with the "admin" role can create new users
- Uses the Supabase service role key for admin operations

## Usage

### From the Team Page

The Team page uses this function through the `createTeamUser` service function. When you invite or add a team member, it will:

1. Try to create the user using this Edge Function
2. If successful, it will return the user details including a generated password
3. If the Edge Function is not available, it will fall back to client-side invitation

### Direct API Call

You can also call this function directly:

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/create-team-user`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      email: 'user@example.com',
      full_name: 'New User',
      role: 'team_member',
      team_id: 'optional-team-id'
    })
  }
);

const data = await response.json();
```

## Response

The function returns a JSON response with the following structure:

```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "full_name": "New User",
    "role": "team_member"
  },
  "password": "generated-password"
}
```

## Deployment

To deploy this function to your Supabase project:

1. Make sure you have the Supabase CLI installed
2. Run `supabase functions deploy create-team-user`
3. Set the required environment variables in the Supabase dashboard:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

## Error Handling

The function includes comprehensive error handling:

- Unauthorized access attempts return a 401 status code
- Missing required fields return a 400 status code
- Server errors return a 500 status code with details about the error