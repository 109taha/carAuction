const Joi = require("joi");

const userSchema = Joi.object({
  first_name: Joi.string().min(3).max(30).required().messages({
    "string.base": "First name should be a string",
    "string.empty": "First name cannot be empty",
    "string.min": "First name has to be at least 3 characters long",
    "string.max": "First name cannot be longer than 30 characters",
    "any.required": "First name is required",
  }),

  last_name: Joi.string().min(3).max(30).required().messages({
    "string.base": "Last name should be a string",
    "string.empty": "Last name cannot be empty",
    "string.min": "Last name has to be at least 3 characters long",
    "string.max": "Last name cannot be longer than 30 characters",
    "any.required": "Last name is required",
  }),

  email: Joi.string().email().required().messages({
    "string.base": "Email should be a string",
    "string.empty": "Email cannot be empty",
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),

  phone: Joi.string()
    .min(10)
    .max(11)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "string.base": "Phone number should be a string",
      "string.empty": "Phone number cannot be empty",
      "string.min": "Phone number has to be at least 10 characters long",
      "string.max": "Phone number cannot be longer than 11 characters",
      "string.pattern.base": "Phone number can contain only numbers",
      "any.required": "Phone number is required",
    }),

  password: Joi.string().min(7).max(40).required().messages({
    "string.base": "Password should be a string",
    "string.empty": "Password cannot be empty",
    "string.min": "Password has to be at least 7 characters long",
    "string.max": "Password cannot be longer than 40 characters",
    "any.required": "Password is required",
  }),

  location: Joi.string(),
  fcm_token: Joi.string(),
});

module.exports = userSchema;
