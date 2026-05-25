export function toTrimmedText(value) {
  return String(value ?? "").trim();
}

export function isSimpleEmailValid(value) {
  return toTrimmedText(value).includes("@");
}

export function isSimplePhoneValid(value) {
  return toTrimmedText(value).length === 9;
}
