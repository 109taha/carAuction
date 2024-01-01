const AdminRegistrationToken = require("../../models/AdminRegistrationToken");
const Joi = require("joi");

const validateAdminRegistrationToken = async (tokenValue, helpers) => {
  const allTokens = await AdminRegistrationToken.getAllTokens();
  const isValid = allTokens.includes(tokenValue);
  if (!isValid)
    return helpers.message(
      "An error occurred while signing you up. Please try later."
    );
  return tokenValue;
};

const adminSchema = Joi.object({
  email: Joi.string().email().required(),

  username: Joi.string()
    .min(5)
    .max(40)
    .pattern(/^[A-Za-z0-9]*$/)
    .required(),

  password: Joi.string().min(7).max(70).required(),

  token: Joi.string().required().external(validateAdminRegistrationToken),
});

module.exports = adminSchema;
