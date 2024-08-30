const cryptoFunctions = require('crypto');

function generateRandomPassword() {
  const jwtSecret = cryptoFunctions.randomBytes(64).toString('hex');
  console.log(jwtSecret);
}

generateRandomPassword();
