export function formatCardNumberInput(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formatCardExpiryInput(value: string, previousValue = "") {
  const isDeleting = value.length < previousValue.length;
  if (isDeleting && previousValue.endsWith("/") && value === previousValue.slice(0, -1)) {
    return value;
  }

  let digits = value.replace(/\D/g, "").slice(0, 4);

  if (
    !isDeleting &&
    (digits.length === 1 || digits.length === 3) &&
    Number(digits[0]) > 1
  ) {
    digits = `0${digits}`;
  }

  if (digits.length < 2) {
    return digits;
  }

  const month = digits.slice(0, 2);
  const year = digits.slice(2);

  return year ? `${month}/${year}` : `${month}/`;
}

export function isValidCardExpiry(value: string) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const month = Number(match[1]);
  return month >= 1 && month <= 12;
}
