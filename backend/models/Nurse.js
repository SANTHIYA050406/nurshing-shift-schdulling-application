const mongoose = require('mongoose');

const nurseSchema = new mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    contact: { type: String },
    email: { type: String },
    maxWorkingHoursPerWeek: { type: Number, default: 40 },
    preferredShift: { type: String, enum: ['Morning', 'Evening', 'Night', 'Any'], default: 'Any' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Nurse', nurseSchema);
