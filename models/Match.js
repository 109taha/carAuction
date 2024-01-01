const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const MatchSchema = new Schema({
  refId: {
    type: String,
    unique: true,
    required: true,
  },
  matchA: {
    type: String,
    required: true,
  },
  matchB: {
    type: String,
    required: true,
  },
});

const Match = model("Match", MatchSchema);

module.exports = Match;
