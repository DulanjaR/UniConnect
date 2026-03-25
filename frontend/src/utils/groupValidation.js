export const GROUP_NAME_MIN_LENGTH = 3;
export const GROUP_NAME_MAX_LENGTH = 50;
export const GROUP_DESCRIPTION_MAX_LENGTH = 300;
export const GROUP_MESSAGE_MAX_LENGTH = 1000;
export const GROUP_REPLY_MAX_LENGTH = 500;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

export const validateGroupForm = (values) => {
  const errors = {};
  const name = values.name.trim();
  const description = values.description.trim();
  const image = values.image.trim();
  const privacy = values.privacy;

  if (!name) {
    errors.name = 'Group name is required';
  } else if (name.length < GROUP_NAME_MIN_LENGTH || name.length > GROUP_NAME_MAX_LENGTH) {
    errors.name = `Group name must be between ${GROUP_NAME_MIN_LENGTH} and ${GROUP_NAME_MAX_LENGTH} characters`;
  }

  if (description.length > GROUP_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be at most ${GROUP_DESCRIPTION_MAX_LENGTH} characters`;
  }

  if (!privacy) {
    errors.privacy = 'Privacy is required';
  } else if (!['public', 'private'].includes(privacy)) {
    errors.privacy = 'Privacy must be either "public" or "private"';
  }

  if (image && !isValidHttpUrl(image)) {
    errors.image = 'Image URL must be a valid http or https URL';
  }

  return errors;
};

export const validateMemberEmail = (value) => {
  const email = value.trim();

  if (!email) {
    return 'Member identifier is required';
  }

  if (!EMAIL_REGEX.test(email)) {
    return 'Enter a valid email address';
  }

  return '';
};

export const validateContent = (
  value,
  { label = 'Message', maxLength = GROUP_MESSAGE_MAX_LENGTH } = {}
) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return `${label} is required`;
  }

  if (trimmedValue.length > maxLength) {
    return `${label} must be at most ${maxLength} characters`;
  }

  return '';
};

export const getApiErrorDetails = (error) => {
  const data = error?.response?.data || {};

  return {
    message: data.message || 'Request failed',
    errors: data.errors || {}
  };
};
