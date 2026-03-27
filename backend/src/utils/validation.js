import mongoose from 'mongoose';

export const GROUP_NAME_MIN_LENGTH = 3;
export const GROUP_NAME_MAX_LENGTH = 50;
export const GROUP_DESCRIPTION_MAX_LENGTH = 300;
export const GROUP_MESSAGE_MAX_LENGTH = 1000;
export const GROUP_REPLY_MAX_LENGTH = 500;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export const validationError = (res, errors, message = 'Validation failed') =>
  res.status(400).json({
    success: false,
    message,
    errors
  });

export const isValidHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

export const ensureObjectId = (res, value, field, label = field) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    validationError(res, {
      [field]: `Invalid ${label}`
    });
    return false;
  }

  return true;
};

export const validateGroupPayload = (payload = {}, { partial = false } = {}) => {
  const errors = {};
  const value = {};

  if (!partial || hasOwn(payload, 'name')) {
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';

    if (!name) {
      errors.name = 'Group name is required';
    } else if (name.length < GROUP_NAME_MIN_LENGTH || name.length > GROUP_NAME_MAX_LENGTH) {
      errors.name = `Group name must be between ${GROUP_NAME_MIN_LENGTH} and ${GROUP_NAME_MAX_LENGTH} characters`;
    } else {
      value.name = name;
    }
  }

  if (!partial || hasOwn(payload, 'description')) {
    const description =
      typeof payload.description === 'string' ? payload.description.trim() : '';

    if (description.length > GROUP_DESCRIPTION_MAX_LENGTH) {
      errors.description = `Description must be at most ${GROUP_DESCRIPTION_MAX_LENGTH} characters`;
    } else {
      value.description = description;
    }
  }

  if (!partial || hasOwn(payload, 'image')) {
    const image = typeof payload.image === 'string' ? payload.image.trim() : '';

    if (image && !isValidHttpUrl(image)) {
      errors.image = 'Image URL must be a valid http or https URL';
    } else {
      value.image = image;
    }
  }

  if (!partial || hasOwn(payload, 'privacy')) {
    const privacy = typeof payload.privacy === 'string' ? payload.privacy : '';

    if (!privacy) {
      errors.privacy = 'Privacy is required';
    } else if (!['public', 'private'].includes(privacy)) {
      errors.privacy = 'Privacy must be either "public" or "private"';
    } else {
      value.privacy = privacy;
    }
  }

  return { errors, value };
};

export const validateEmail = (email) => EMAIL_REGEX.test(email);

export const validateAddMemberPayload = (payload = {}) => {
  const errors = {};
  const value = {};

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const userId = typeof payload.userId === 'string' ? payload.userId.trim() : '';
  const role = typeof payload.role === 'string' ? payload.role : 'member';

  if (!email && !userId) {
    errors.memberIdentifier = 'Member identifier is required';
  }

  if (email) {
    if (!validateEmail(email)) {
      errors.email = 'Enter a valid email address';
    } else {
      value.email = email;
    }
  }

  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      errors.userId = 'Invalid user id';
    } else {
      value.userId = userId;
    }
  }

  if (!['member', 'group_admin'].includes(role)) {
    errors.role = 'Role must be either "group_admin" or "member"';
  } else {
    value.role = role;
  }

  return { errors, value };
};

export const validateGroupRole = (role) => {
  if (!['member', 'group_admin'].includes(role)) {
    return {
      role: 'Role must be either "group_admin" or "member"'
    };
  }

  return {};
};

export const validateTextContent = (
  rawValue,
  { field = 'content', label = 'Content', maxLength = GROUP_MESSAGE_MAX_LENGTH } = {}
) => {
  const value = typeof rawValue === 'string' ? rawValue.trim() : '';

  if (!value) {
    return {
      errors: {
        [field]: `${label} is required`
      },
      value
    };
  }

  if (value.length > maxLength) {
    return {
      errors: {
        [field]: `${label} must be at most ${maxLength} characters`
      },
      value
    };
  }

  return { errors: {}, value };
};
