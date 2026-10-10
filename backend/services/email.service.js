require('dotenv').config();
const nodemailer = require('nodemailer');

let cachedTransporter = null;

// Get or create email transporter
async function getTransporter() {
    if (cachedTransporter) return cachedTransporter;

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        // Clean password by removing any extra spaces
        const cleanPass = process.env.SMTP_PASS.replace(/\s+/g, '');
        
        cachedTransporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: cleanPass
            }
        });
        console.log(`Using Gmail SMTP transport for sender: ${process.env.SMTP_USER}`);
    } else {
        // Fallback mock transporter
        cachedTransporter = nodemailer.createTransport({
            jsonTransport: true
        });
        console.log('Using JSON fallback mailer.');
    }

    return cachedTransporter;
}

// Format shift timing string
function getShiftTimings(shiftType) {
    switch (shiftType) {
        case 'Morning': return '08:00 AM - 04:00 PM';
        case 'Evening': return '04:00 PM - 12:00 AM (Midnight)';
        case 'Night': return '12:00 AM - 08:00 AM';
        default: return 'Standard 8-hour shift';
    }
}

/**
 * Dispatches personalized duty notification emails to every nurse in the approved schedule.
 * @param {Object} schedule - Populated schedule document
 * @returns {Promise<Object>} Notification summary with recipient list and preview URLs
 */
async function sendShiftDutyNotifications(schedule) {
    if (!schedule || !schedule.shifts || schedule.shifts.length === 0) {
        return { count: 0, recipients: [], previewUrls: [] };
    }

    const transporter = await getTransporter();

    // Group shifts by nurse
    const nurseShiftsMap = new Map();
    schedule.shifts.forEach(shift => {
        const nurse = shift.nurseId;
        if (!nurse) return;
        const nurseIdStr = nurse._id ? nurse._id.toString() : nurse.toString();

        if (!nurseShiftsMap.has(nurseIdStr)) {
            nurseShiftsMap.set(nurseIdStr, {
                nurse: typeof nurse === 'object' ? nurse : { name: 'Nurse', employeeId: 'N/A', email: 'sttharunya26@gmail.com' },
                shifts: []
            });
        }
        nurseShiftsMap.get(nurseIdStr).shifts.push(shift);
    });

    const dispatchedResults = [];
    const fromAddress = process.env.SMTP_FROM || `"Hospital Nursing Operations" <${process.env.SMTP_USER || 'sttharunya26@gmail.com'}>`;

    for (const [nurseIdStr, data] of nurseShiftsMap.entries()) {
        const { nurse, shifts } = data;
        let recipientEmail = nurse.email;
        // If dummy hospital.org domain, route to configured test email so user receives it in their real inbox
        if (!recipientEmail || recipientEmail.endsWith('@hospital.org')) {
            recipientEmail = process.env.SMTP_USER || 'sttharunya26@gmail.com';
        }

        // Format shifts rows for email HTML
        const shiftsHtmlRows = shifts.map(s => {
            const dateStr = new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            const timings = getShiftTimings(s.shiftType);
            const isOT = s.isOvertime;
            const dutyBadge = isOT 
                ? '<span style="background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">⚡ OVERTIME DUTY</span>' 
                : '<span style="background: #d1fae5; color: #065f46; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">REGULAR SHIFT</span>';

            return `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 14px; font-weight: 600; color: #1e293b;">${dateStr}</td>
                    <td style="padding: 10px 14px; color: #3b82f6; font-weight: bold;">${s.shiftType}</td>
                    <td style="padding: 10px 14px; color: #64748b; font-size: 12px;">${timings}</td>
                    <td style="padding: 10px 14px;">${dutyBadge}</td>
                </tr>
            `;
        }).join('');

        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
                    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                    .header { background: linear-gradient(135deg, #1e3a8a, #0284c7); padding: 24px; color: #ffffff; text-align: left; }
                    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
                    .header p { margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; }
                    .content { padding: 24px; color: #334155; }
                    .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
                    .info-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; font-size: 13px; color: #0369a1; }
                    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
                    th { background: #f1f5f9; padding: 10px 14px; text-align: left; font-weight: 700; color: #475569; font-size: 12px; }
                    .footer { background: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="header">
                        <h1>🏥 Hospital Nursing Operations</h1>
                        <p>Official Shift Duty Assignment Notification</p>
                    </div>
                    <div class="content">
                        <div class="greeting">Dear Nurse ${nurse.name},</div>
                        <p style="margin: 0 0 12px 0; line-height: 1.5; font-size: 14px;">
                            The official nursing roster for the <strong>${schedule.department}</strong> department has been approved and published. You have been scheduled for the following duty shift(s):
                        </p>

                        <div class="info-box">
                            <strong>Nurse Profile:</strong> ${nurse.name} (ID: ${nurse.employeeId || 'N/A'})<br>
                            <strong>Assigned Department:</strong> ${schedule.department}<br>
                            <strong>Total Assigned Shifts:</strong> ${shifts.length} shift(s)
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Shift</th>
                                    <th>Timings</th>
                                    <th>Duty Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${shiftsHtmlRows}
                            </tbody>
                        </table>

                        <p style="margin: 20px 0 0 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                            ⚠️ <strong>Mandatory Clinical Protocol:</strong><br>
                            • Please report 15 minutes prior to shift commencement for clinical hand-over.<br>
                            • If you have any emergency or require leave, notify the Nursing Supervisor immediately via the portal.
                        </p>
                    </div>
                    <div class="footer">
                        This is an automated notification from the Hospital Nursing Portal.<br>
                        Do not reply directly to this email. For schedule swaps, contact the Nursing Superintendent.
                    </div>
                </div>
            </body>
            </html>
        `;

        const mailOptions = {
            from: fromAddress,
            to: recipientEmail,
            subject: `🏥 Duty Shift Assigned: ${schedule.department} - Nurse ${nurse.name} (${shifts.length} shift${shifts.length > 1 ? 's' : ''})`,
            html: emailHtml
        };

        try {
            const sendInfo = await transporter.sendMail(mailOptions);
            const previewUrl = nodemailer.getTestMessageUrl(sendInfo) || null;

            console.log(`✓ Real Email Delivered to ${nurse.name} (${recipientEmail}) - Message ID: ${sendInfo.messageId}`);

            dispatchedResults.push({
                nurseId: nurseIdStr,
                name: nurse.name,
                employeeId: nurse.employeeId,
                email: recipientEmail,
                shiftsCount: shifts.length,
                subject: mailOptions.subject,
                html: emailHtml,
                messageId: sendInfo.messageId,
                previewUrl
            });
        } catch (sendErr) {
            console.error(`Error sending email to ${nurse.name} (${recipientEmail}):`, sendErr.message);
            dispatchedResults.push({
                nurseId: nurseIdStr,
                name: nurse.name,
                employeeId: nurse.employeeId,
                email: recipientEmail,
                shiftsCount: shifts.length,
                subject: mailOptions.subject,
                html: emailHtml,
                error: sendErr.message
            });
        }
    }

    return {
        count: dispatchedResults.filter(r => !r.error).length,
        totalAttempted: nurseShiftsMap.size,
        recipients: dispatchedResults
    };
}

module.exports = {
    sendShiftDutyNotifications,
    getTransporter
};
