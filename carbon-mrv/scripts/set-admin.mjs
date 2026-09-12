import clerkPkg from '@clerk/nextjs/server';
const { clerkClient } = clerkPkg;

async function main() {
  const email = 'kvbhavsar35@gmail.com';
  console.log(`Looking up Clerk user with email: ${email}`);
  
  const client = await clerkClient();
  const users = await client.users.getUserList({ emailAddress: [email] });
  
  if (users.data.length > 0) {
    const user = users.data[0];
    console.log(`Found user ${user.id}. Setting publicMetadata.role = 'ADMIN'`);
    
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: { role: 'ADMIN' }
    });
    
    console.log('Successfully updated user to ADMIN in Clerk.');
  } else {
    console.error(`User with email ${email} not found in Clerk. Please sign up or sign in first.`);
  }
}

main().catch(console.error);
