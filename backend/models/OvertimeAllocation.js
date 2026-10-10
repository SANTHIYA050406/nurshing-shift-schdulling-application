const mongoose = require('mongoose');

const overtimeAllocationSchema = new mongoose.Schema({
    nurseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nurse', required: true },
    date: { type: Date, required: true },
    allocatedHours: { type: Number, required: true },
    reason: { type: String, required: true },
    allocatedBy: { type: String, default: 'Hospital Admin' },
    shiftPeriod: { type: String, enum: ['Morning Extension', 'Evening Extension', 'Night Extension', 'Weekend Emergency'], default: 'Evening Extension' },
    status: { type: String, enum: ['Pending Nurse Approval', 'Accepted', 'Declined'], default: 'Pending Nurse Approval' },
    nurseRemarks: { type: String, default: '' },
    completedHours: { type: Number, default: 0 },
    approvedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OvertimeAllocation', overtimeAllocationSchema);
