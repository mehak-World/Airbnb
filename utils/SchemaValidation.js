const joi = require("joi")

const validation_schema = joi.object({
    title: joi.string().required(),
    description: joi.string().required(),
    price: joi.number().min(1).required(),
    location: joi.string().required(),
    country: joi.string().required(),
    image: joi.string().allow('').optional()
});


module.exports = validation_schema;