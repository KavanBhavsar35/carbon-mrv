const email = process.argv[2] || 'kvbhavsar35@gmail.com';
const role = (process.argv[3] || 'ADMIN').toUpperCase();
const secretKey = process.env.CLERK_SECRET_KEY;

if (!secretKey) {
  console.error('Missing CLERK_SECRET_KEY in environment.');
  process.exit(1);
}

async function main() {
  console.log(`Looking up Clerk user with email: ${email}`);
  
  const searchRes = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`, {
    headers: { 'Authorization': `Bearer ${secretKey}` }
  });
  
  if (!searchRes.ok) {
    console.error('Failed to search for user:', await searchRes.text());
    return;
  }
  
  const users = await searchRes.json();
  if (users && users.length > 0) {
    const user = users[0];
    console.log(`Found user ${user.id}. Setting public_metadata.role = '${role}'`);
    
    const updateRes = await fetch(`https://api.clerk.com/v1/users/${user.id}/metadata`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        public_metadata: { role }
      })
    });
    
    if (updateRes.ok) {
      console.log(`Successfully updated user to ${role} in Clerk.`);
    } else {
      console.error('Failed to update user:', await updateRes.text());
    }
  } else {
    console.error(`User with email ${email} not found in Clerk. Please sign up first.`);
  }
}

main().catch(console.error);
