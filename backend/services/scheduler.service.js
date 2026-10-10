const Nurse = require('../models/Nurse');
const Availability = require('../models/Availability');
const LeaveRequest = require('../models/LeaveRequest');
const OvertimeAllocation = require('../models/OvertimeAllocation');

async function generateSchedule({ periodStart, periodEnd, department, requirements, maxConsecutiveShifts = 5 }) {
    // requirements: { morning: 3, evening: 0, night: 0 } or user specified
    const start = new Date(periodStart);
    start.setHours(0, 0, 0, 0);

    const end = new Date(periodEnd);
    end.setHours(23, 59, 59, 999);

    // Fetch all nurses credentialed for this department
    const deptNurses = await Nurse.find({ department });
    if (!deptNurses || deptNurses.length === 0) {
        throw new Error(`No nurses registered in ${department} department. Please register or transfer nurses to ${department} first.`);
    }

    // Fetch all nurses for possible backup cross-department coverage if department is totally exhausted
    const allHospitalNurses = await Nurse.find();

    // Fetch existing overtime records to track accumulated overtime
    const allOvertimeAllocations = await OvertimeAllocation.find();
    const overtimeHoursMap = new Map();
    allOvertimeAllocations.forEach(ot => {
        const id = ot.nurseId.toString();
        const hrs = ot.completedHours || ot.allocatedHours || 0;
        overtimeHoursMap.set(id, (overtimeHoursMap.get(id) || 0) + hrs);
    });

    // Initialize state tracking per nurse in department
    const nurseMap = new Map();
    deptNurses.forEach(n => {
        nurseMap.set(n._id.toString(), {
            _id: n._id,
            name: n.name,
            employeeId: n.employeeId,
            department: n.department,
            designation: n.designation,
            maxWorkingHoursPerWeek: n.maxWorkingHoursPerWeek || 40,
            preferredShift: n.preferredShift || 'Any',
            assignedHours: 0,
            accumulatedOvertime: overtimeHoursMap.get(n._id.toString()) || 0,
            consecutiveDays: 0,
            nightShiftsCount: 0,
            lastShiftDate: null
        });
    });

    const shifts = [];
    const shortages = [];
    const overtimeAllocationsSummary = [];
    let conflicts = 0;

    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.round((end.getTime() - start.getTime()) / dayMs) + 1;

    for (let dayIdx = 0; dayIdx < totalDays; dayIdx++) {
        const currentDate = new Date(start.getTime() + dayIdx * dayMs);
        currentDate.setHours(0, 0, 0, 0);

        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Constraint 1: Check Approved Leave ONLY
        // Pending leaves do NOT exclude nurses; ONLY Approved leaves exclude nurses.
        const approvedLeaves = await LeaveRequest.find({
            status: 'Approved',
            startDate: { $lte: dayEnd },
            endDate: { $gte: dayStart }
        });

        const explicitLeaveAvailabilities = await Availability.find({
            status: 'Leave',
            date: { $gte: dayStart, $lte: dayEnd }
        });

        const onLeaveNurseIds = new Set([
            ...approvedLeaves.map(l => l.nurseId.toString()),
            ...explicitLeaveAvailabilities.map(a => a.nurseId.toString())
        ]);

        const shiftTypes = ['Morning', 'Evening', 'Night'];

        for (const shiftType of shiftTypes) {
            const requiredCount = Number(requirements[shiftType.toLowerCase()]) || 0;
            if (requiredCount === 0) continue;

            // 1. Regular Eligible Nurses (Within 40h/week limit, no conflicts)
            const eligibleRegularNurses = [];

            for (const [id, nurse] of nurseMap.entries()) {
                // Exclude if on approved leave
                if (onLeaveNurseIds.has(id)) continue;

                // Shift conflict: No double-booking same day for regular shift
                const alreadyAssignedToday = shifts.some(s => 
                    new Date(s.date).toDateString() === currentDate.toDateString() &&
                    s.nurseId.toString() === id
                );
                if (alreadyAssignedToday) continue;

                // Max weekly regular hours limit (40 hours)
                if (nurse.assignedHours + 8 > nurse.maxWorkingHoursPerWeek) continue;

                // Consecutive shifts limit
                if (nurse.consecutiveDays >= maxConsecutiveShifts) continue;

                eligibleRegularNurses.push(nurse);
            }

            // Workload Balancing Sort for regular assignments
            eligibleRegularNurses.sort((a, b) => {
                const aPref = a.preferredShift === shiftType ? -1 : 0;
                const bPref = b.preferredShift === shiftType ? -1 : 0;
                if (aPref !== bPref) return aPref - bPref;

                if (shiftType === 'Night' && a.nightShiftsCount !== b.nightShiftsCount) {
                    return a.nightShiftsCount - b.nightShiftsCount;
                }
                if (a.assignedHours !== b.assignedHours) {
                    return a.assignedHours - b.assignedHours;
                }
                return a.consecutiveDays - b.consecutiveDays;
            });

            // Assign regular nurses
            let assignedCount = 0;
            for (const nurse of eligibleRegularNurses) {
                if (assignedCount >= requiredCount) break;

                shifts.push({
                    date: currentDate,
                    shiftType,
                    nurseId: nurse._id,
                    isOvertime: false,
                    overtimeReason: ''
                });

                nurse.assignedHours += 8;
                if (shiftType === 'Night') nurse.nightShiftsCount += 1;

                if (nurse.lastShiftDate) {
                    const prevDate = new Date(nurse.lastShiftDate);
                    prevDate.setHours(0, 0, 0, 0);
                    const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / dayMs);
                    nurse.consecutiveDays = diffDays === 1 ? nurse.consecutiveDays + 1 : 1;
                } else {
                    nurse.consecutiveDays = 1;
                }
                nurse.lastShiftDate = currentDate;
                assignedCount++;
            }

            // 2. OVERTIME ALLOCATION (If leave or shortage causes assignedCount < requiredCount)
            // Policy: Each department requires 3 nurses per shift. If leave creates a vacancy,
            // allocate overtime to off-duty nurse with lowest accumulated overtime hours.
            if (assignedCount < requiredCount) {
                const deficit = requiredCount - assignedCount;

                // Find eligible overtime candidates in the department first
                const overtimeCandidates = [];
                for (const [id, nurse] of nurseMap.entries()) {
                    if (onLeaveNurseIds.has(id)) continue; // Must not be on leave

                    // Anti-fatigue check: cannot work the exact same shift twice on same day
                    const isWorkingSameShift = shifts.some(s => 
                        new Date(s.date).toDateString() === currentDate.toDateString() &&
                        s.shiftType === shiftType &&
                        s.nurseId.toString() === id
                    );
                    if (isWorkingSameShift) continue;

                    overtimeCandidates.push(nurse);
                }

                // If department exhausted, allow eligible nurses from other departments (cross-department coverage)
                if (overtimeCandidates.length < deficit) {
                    allHospitalNurses.forEach(hn => {
                        const hid = hn._id.toString();
                        if (nurseMap.has(hid)) return; // already checked department nurses
                        if (onLeaveNurseIds.has(hid)) return;

                        const isWorkingSameShift = shifts.some(s => 
                            new Date(s.date).toDateString() === currentDate.toDateString() &&
                            s.shiftType === shiftType &&
                            s.nurseId.toString() === hid
                        );
                        if (isWorkingSameShift) return;

                        overtimeCandidates.push({
                            _id: hn._id,
                            name: hn.name,
                            employeeId: hn.employeeId,
                            department: hn.department,
                            designation: hn.designation,
                            maxWorkingHoursPerWeek: hn.maxWorkingHoursPerWeek || 40,
                            preferredShift: hn.preferredShift || 'Any',
                            assignedHours: 0,
                            accumulatedOvertime: overtimeHoursMap.get(hid) || 0,
                            consecutiveDays: 0,
                            nightShiftsCount: 0,
                            lastShiftDate: null
                        });
                    });
                }

                // Prioritize candidate with LOWEST accumulated overtime (fair overtime distribution)
                overtimeCandidates.sort((a, b) => {
                    if (a.accumulatedOvertime !== b.accumulatedOvertime) {
                        return a.accumulatedOvertime - b.accumulatedOvertime;
                    }
                    return a.assignedHours - b.assignedHours;
                });

                // Allocate overtime shifts
                for (const otNurse of overtimeCandidates) {
                    if (assignedCount >= requiredCount) break;

                    const dateLabel = currentDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                    const reason = `Overtime allocation: 3-nurse quota coverage for ${department} (${shiftType} shift)`;

                    shifts.push({
                        date: currentDate,
                        shiftType,
                        nurseId: otNurse._id,
                        isOvertime: true,
                        overtimeReason: reason
                    });

                    // Update accumulated overtime
                    otNurse.accumulatedOvertime += 8;
                    otNurse.assignedHours += 8;
                    assignedCount++;

                    // Record allocation summary
                    overtimeAllocationsSummary.push(
                        `⚡ Overtime allocated to ${otNurse.name} (${otNurse.employeeId}) on ${dateLabel} for ${shiftType} shift in ${department}`
                    );

                    // Persist to OvertimeAllocation collection
                    try {
                        const otEntry = new OvertimeAllocation({
                            nurseId: otNurse._id,
                            date: currentDate,
                            allocatedHours: 8,
                            shiftPeriod: shiftType === 'Morning' ? 'Morning Extension' : shiftType === 'Evening' ? 'Evening Extension' : 'Night Extension',
                            reason: `Auto-allocated overtime: 3-nurse shift quota maintenance for ${department} (${shiftType})`,
                            allocatedBy: 'Auto Scheduler Engine',
                            status: 'Accepted',
                            completedHours: 8,
                            approvedAt: new Date()
                        });
                        await otEntry.save();
                    } catch (otErr) {
                        console.error('Error saving OvertimeAllocation record:', otErr.message);
                    }
                }
            }

            // Only flag shortage if even overtime allocation could not meet the requirement
            if (assignedCount < requiredCount) {
                const dateLabel = currentDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                shortages.push(`Staff Shortage on ${dateLabel} for ${shiftType} shift in ${department}. Required: ${requiredCount}, Assigned: ${assignedCount}`);
            }
        }
    }

    return {
        periodStart: start,
        periodEnd: end,
        department,
        shifts,
        validation: {
            conflicts,
            unassignedShifts: shortages.length,
            shortages,
            overtimeAllocations: overtimeAllocationsSummary,
            isValid: shortages.length === 0
        }
    };
}

module.exports = { generateSchedule };
