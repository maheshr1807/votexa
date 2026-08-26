const mongoose = require('mongoose');

const governmentOfficeSchema = new mongoose.Schema({
  officeName: {
    type: String,
    required: [true, 'Office name is required'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  officerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('GovernmentOffice', governmentOfficeSchema);
