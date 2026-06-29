const mongoose = require('mongoose');
const { v7: uuidv7 } = require('uuid');

const StoreSchema = new mongoose.Schema(
  {
    _id:       { type: String, default: uuidv7 },
    name:      { type: String, required: true },
    code_hash: { type: String, required: true },
  },
  {
    _id: false,
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

module.exports = mongoose.model('Store', StoreSchema);
