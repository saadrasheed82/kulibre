# Team Page Supabase Auth Integration

This document outlines the implementation of Supabase Auth integration for the Team page.

## Overview

We've implemented a complete solution for creating and managing team members in the Supabase Auth system. This includes:

1. A Supabase Edge Function for creating users in the Auth system
2. A team service layer for interacting with the Edge Function and providing fallback mechanisms
3. Updated Team page components to use the new service layer

## Components

### 1. Supabase Edge Function: `create-team-user`

Located at `supabase/functions/create-team-user/index.ts`, this Edge Function:

- Creates a new user in the Supabase Auth system
- Sets up the user's profile with the provided information
- Assigns the user to a team if specified
- Creates an invitation record
- Returns a generated password for the new user

### 2. Team Service Layer

Located at `src/lib/services/team-service.ts`, this service provides:

- `createTeamUser`: Creates a user in the Supabase Auth system using the Edge Function
- `inviteTeamMember`: Client-side fallback for inviting team members
- `getTeamMembers`: Fetches all team members with their projects and status
- `updateTeamMember`: Updates a team member's profile
- `removeTeamMember`: Removes a team member

### 3. Team Page Updates

The Team page (`src/pages/Team.tsx`) has been updated to:

- Use the team service for fetching team members
- Use the team service for inviting and adding team members
- Use the team service for updating team members
- Use the team service for removing team members

## How It Works

### Adding a Team Member

1. When a user adds a team member, the `addMemberMutation` calls the `createTeamUser` function
2. The `createTeamUser` function calls the Supabase Edge Function
3. If successful, the Edge Function creates a user in the Auth system and returns the user details
4. If the Edge Function is not available, it falls back to client-side creation
5. The user is shown a success message with the generated password (if available)

### Inviting a Team Member

1. When a user invites a team member, the `inviteMemberMutation` calls the `createTeamUser` function
2. The process is similar to adding a team member, but with a different UI flow
3. The user is shown a success message with the generated password (if available)

### Updating a Team Member

1. When a user updates a team member, the `updateMemberMutation` calls the `updateTeamMember` function
2. The `updateTeamMember` function updates the user's profile in Supabase
3. Project assignments are also updated if necessary

### Removing a Team Member

1. When a user removes a team member, the `removeMemberMutation` calls the `removeTeamMember` function
2. The `removeTeamMember` function marks the user as inactive and removes their project assignments

## Security Considerations

- Only authenticated users can call the Edge Function
- Only users with the "admin" role can create new users
- The Edge Function uses the Supabase service role key for admin operations
- Passwords are generated securely and only returned to the client once

## Next Steps

1. Implement email sending functionality for invitations
2. Create an invitation acceptance flow
3. Add more detailed error handling and validation
4. Implement password reset functionality