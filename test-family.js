const crypto = require('crypto');

// Test the inviteCode generation
function generateInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Generate 10 codes to test
console.log('Testing inviteCode generation:');
for (let i = 0; i < 10; i++) {
  const code = generateInviteCode();
  console.log(`Code ${i + 1}: ${code} (length: ${code.length})`);
}