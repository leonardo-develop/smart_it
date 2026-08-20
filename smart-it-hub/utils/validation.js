const IDENTIFIER_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

function isValidIdentifier(value) {
    return typeof value === "string" && IDENTIFIER_PATTERN.test(value);
}

function numberInRange(value, min, max) {
    const number = Number(value);
    return Number.isFinite(number) && number >= min && number <= max;
}

function isValidTime(value) {
    return typeof value === "string" && TIME_PATTERN.test(value);
}

function isValidDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00Z`);
    return date.toISOString().slice(0, 10) === value;
}

module.exports = {
    isValidIdentifier,
    numberInRange,
    isValidTime,
    isValidDate
};
