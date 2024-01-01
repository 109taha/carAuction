const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const AdminSchema = new Schema({
    email: {
        type: String,
        unique: true,
        index: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
        required: true
    },
    username: {
        type: String,
        unique: true,
        index: true,
        trim: true,
        lowercase: true,
        match: /^[A-Za-z0-9]*$/,
        required: true    
    },
    salt: {
        type: String,
        select: false,
        required: true,
    },
    hash: {
        type: String,
        select: false,
        required: true,
    }
});

const Admin = model("Admin", AdminSchema);

module.exports = Admin;