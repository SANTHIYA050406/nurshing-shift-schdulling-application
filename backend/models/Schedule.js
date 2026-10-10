const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    department: { type: String, required: true },
    shifts: [{
        date: { type: Date, required: true },
        shiftType: { type: String, enum: ['Morning', 'Evening', 'Night'], required: true },
        nurseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nurse', required: true },
        isOvertime: { type: Boolean, default: false },
        overtimeReason: { type: String, default: '' }
    }],
    validation: {
        conflicts: { type: Number, default: 0 },
        unassignedShifts: { type: Number, default: 0 },
        shortages: [{ type: String }],
        overtimeAllocations: [{ type: String }],
        isValid: { type: Boolean, default: true }
    },
    status: { type: String, enum: ['Draft', 'Approved'], default: 'Draft' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', scheduleSchema);
