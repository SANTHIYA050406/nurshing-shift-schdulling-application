const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
    nurseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nurse', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['Available', 'Leave'], default: 'Available' }
});

availabilitySchema.index({ nurseId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Availability', availabilitySchema);
