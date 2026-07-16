export function generateRoomCode() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  let code = "";
  code += letters[Math.floor(Math.random() * letters.length)];
  code += letters[Math.floor(Math.random() * letters.length)];
  code += letters[Math.floor(Math.random() * letters.length)];
  code += digits[Math.floor(Math.random() * digits.length)];
  code += digits[Math.floor(Math.random() * digits.length)];
  code += digits[Math.floor(Math.random() * digits.length)];
  return code;
}