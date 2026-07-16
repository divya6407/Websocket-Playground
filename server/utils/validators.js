export function isValidString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidRoomId(roomId) {
  return typeof roomId === "string" && /^[A-Z]{3}\d{3}$/.test(roomId);
}