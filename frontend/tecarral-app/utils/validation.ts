export function normalizeInputText(value: unknown) {
  return String(value ?? '').trim();
}

export function isSimpleEmailValid(value: unknown) {
  return normalizeInputText(value).includes('@');
}

export function isSimplePhoneValid(value: unknown) {
  return normalizeInputText(value).length === 9;
}
