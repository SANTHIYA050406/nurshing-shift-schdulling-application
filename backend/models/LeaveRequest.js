const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
    nurseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Nurse', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, default: 'Medical / Personal Leave' },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    appliedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    adminNotes: { type: String, default: '' }
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
