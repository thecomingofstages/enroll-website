const ExcelJS           = require('exceljs');
const RegistrationModel = require('../models/Registration.model');
const ActivityModel     = require('../models/Activity.model');
const AttendanceModel   = require('../models/Attendance.model');
const UserModel         = require('../models/User.model');
const PaymentModel      = require('../models/Payment.model');
const QRUtil            = require('../utils/QR.util');

// ── Bangkok date key ──────────────────────────────────────────────────────────
function bangkokDateKey() {
  const bkk = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return bkk.toISOString().slice(0, 10);
}

// ── Excel styling helpers ─────────────────────────────────────────────────────
const STYLES = {
  headerFill:   { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B2A4A' } },
  headerFont:   { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Arial' },
  subHeaderFill:{ type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E7490' } },
  subHeaderFont:{ bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Arial' },
  altRowFill:   { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } },
  paidFill:     { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } },
  joinedFill:   { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE9FE' } },
  pendingFill:  { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } },
  thinBorder: {
    top:    { style: 'thin', color: { argb: 'FFCBD5E1' } },
    left:   { style: 'thin', color: { argb: 'FFCBD5E1' } },
    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    right:  { style: 'thin', color: { argb: 'FFCBD5E1' } },
  },
};

function styleHeader(row) {
  row.eachCell(cell => {
    cell.fill   = STYLES.headerFill;
    cell.font   = STYLES.headerFont;
    cell.border = STYLES.thinBorder;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  row.height = 28;
}

function styleSubHeader(row) {
  row.eachCell(cell => {
    cell.fill   = STYLES.subHeaderFill;
    cell.font   = STYLES.subHeaderFont;
    cell.border = STYLES.thinBorder;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  row.height = 22;
}

function styleDataRow(row, rowIndex, status) {
  const statusFill = { PAID: STYLES.paidFill, JOINED: STYLES.joinedFill, PENDING: STYLES.pendingFill };
  row.eachCell({ includeEmpty: true }, (cell, colNum) => {
    cell.border    = STYLES.thinBorder;
    cell.alignment = { vertical: 'middle', wrapText: false };
    // Alternate row shading unless there's a status fill
    if (rowIndex % 2 === 0 && !statusFill[status]) {
      cell.fill = STYLES.altRowFill;
    }
  });
  row.height = 18;
}

function autoWidth(sheet, minWidth = 10, maxWidth = 40) {
  sheet.columns.forEach(col => {
    let max = minWidth;
    col.eachCell({ includeEmpty: false }, cell => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 2, maxWidth);
  });
}

class EventHelper {

  // ── POST /events/scan ───────────────────────────────────────────────────────
  /**
   * Verify a participant QR token against a specific event and check them in.
   *
   * Flow:
   * 1. Verify QR token (HMAC + expiry) — throws INVALID_QR or QR_EXPIRED
   * 2. Extract user_id from payload
   * 3. Find REGISTRATION for (user_id, activity_id = eventId), not CANCELLED
   *    — throws NOT_ENROLLED (404) if missing
   * 4. Confirm status === PAID
   *    — throws ALREADY_JOINED (422) if already scanned
   *    — throws PAYMENT_REQUIRED (422) if PENDING
   * 5. Fetch user for display name
   * 6. Atomic $set status → JOINED, group_name if provided
   * 7. $push user_id into Attendance map for today's Bangkok date key
   * 8. Return display data for scanner device
   */
  static async scan(qrToken, eventId, groupName) {
    // ── 1. Verify QR ───────────────────────────────────────────────────────
    if (!qrToken || !eventId) {
      const err = new Error('qr_token and event_id are required.');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    // QRUtil.verify throws INVALID_QR or QR_EXPIRED with correct statusCode + code
    const decoded = QRUtil.verify(qrToken);
    const { user_id } = decoded;

    // ── 2. Find registration ───────────────────────────────────────────────
    const registration = await RegistrationModel.findOne({
      user_id,
      activity_id: eventId,
      status: { $nin: ['CANCELLED'] },
    }).lean();

    if (!registration) {
      const err = new Error('This participant is not enrolled in this event.');
      err.statusCode = 404;
      err.code = 'NOT_ENROLLED';
      throw err;
    }

    // ── 3. Status guards ───────────────────────────────────────────────────
    if (registration.status === 'JOINED') {
      const err = new Error('This ticket has already been scanned.');
      err.statusCode = 422;
      err.code = 'ALREADY_JOINED';
      throw err;
    }

    if (registration.status === 'PENDING') {
      const err = new Error('This registration has not been paid yet.');
      err.statusCode = 422;
      err.code = 'PAYMENT_REQUIRED';
      throw err;
    }

    // ── 4. Fetch user for display ──────────────────────────────────────────
    const user = await UserModel.findById(user_id).lean();

    // ── 5. Fetch activity name ─────────────────────────────────────────────
    const activity = await ActivityModel.findById(eventId).select('name').lean();

    // ── 6. Set registration → JOINED ──────────────────────────────────────
    const updateFields = { status: 'JOINED' };
    if (groupName) updateFields.group_name = groupName;

    await RegistrationModel.findByIdAndUpdate(registration._id, { $set: updateFields });

    // ── 7. Push to Attendance map for today (Bangkok UTC+7) ───────────────
    const dateKey = bangkokDateKey();
    await AttendanceModel.findOneAndUpdate(
      { activity_id: eventId },
      { $push: { [`attendance.${dateKey}`]: user_id } },
      { upsert: true }  // safety: if Attendance doc was somehow missing
    );

    // ── 8. Return scanner display data ────────────────────────────────────
    return {
      registration_id: registration._id,
      status:          'JOINED',
      group_name:      groupName || registration.group_name || null,
      checked_in_at:   new Date().toISOString(),
      user: {
        full_name: user ? `${user.first_name} ${user.last_name}` : '—',
        nickname:  user?.nickname || '—',
        phone:     user?.phone    || '—',
      },
      activity_name: activity?.name || '—',
      date_key:      dateKey,
    };
  }

  // ── POST /admin/activities/:id/export ───────────────────────────────────────
  /**
   * Generate a rich multi-sheet Excel workbook for an activity and return it
   * as a Buffer for streaming to the client.
   *
   * Sheets:
   *   1. Summary          — activity KPIs, seat fill rate, revenue, group breakdown
   *   2. All Registrations — full roster with status colour coding + custom answers
   *   3. Attendance        — per-day check-in grid (rows = participants, cols = dates)
   *   4. Payments          — payment records for accounting
   *   5. Demographics      — gender breakdown, interest tags
   */
  static async exportActivity(activityId) {

    // ── Fetch all data ─────────────────────────────────────────────────────
    const activity = await ActivityModel.findById(activityId).lean();
    if (!activity) {
      const err = new Error('Activity not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const registrations = await RegistrationModel.find({ activity_id: activityId }).lean();

    // Fetch all users for registered participants
    const userIds  = [...new Set(registrations.map(r => r.user_id))];
    const users    = await UserModel.find({ _id: { $in: userIds } }).lean();
    const userMap  = Object.fromEntries(users.map(u => [u._id, u]));

    // Payments for PAID/JOINED regs
    const paidRegIds = registrations.filter(r => ['PAID', 'JOINED'].includes(r.status)).map(r => r._id);
    const payments   = await PaymentModel.find({ registration_id: { $in: paidRegIds } }).lean();
    const paymentMap = Object.fromEntries(payments.map(p => [p.registration_id, p]));

    // Attendance doc
    const attendanceDoc = await AttendanceModel.findOne({ activity_id: activityId }).lean();
    // Convert Mongoose Map → plain object
    const attendanceMap = attendanceDoc?.attendance
      ? (attendanceDoc.attendance instanceof Map
          ? Object.fromEntries(attendanceDoc.attendance)
          : attendanceDoc.attendance)
      : {};

    // Derived stats
    const statuses   = { PENDING: 0, PAID: 0, JOINED: 0, CANCELLED: 0 };
    registrations.forEach(r => { if (statuses[r.status] !== undefined) statuses[r.status]++; });
    const revenue        = payments.filter(p => p.status === 'VERIFIED').reduce((s, p) => s + (p.amount || 0), 0);
    const attendanceDates = Object.keys(attendanceMap).sort();
    const totalCheckins  = Object.values(attendanceMap).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0);

    // ── Build Workbook ─────────────────────────────────────────────────────
    const wb       = new ExcelJS.Workbook();
    wb.creator     = 'TCOS System';
    wb.created     = new Date();
    wb.modified    = new Date();

    const exportedAt = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
    const safeActName = activity.name.replace(/[\/\\?%*:|"<>]/g, '-').slice(0, 30);

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 1: Summary
    // ════════════════════════════════════════════════════════════════════════
    {
      const ws = wb.addWorksheet('📊 Summary', { properties: { tabColor: { argb: 'FF1B2A4A' } } });
      ws.columns = [{ width: 28 }, { width: 22 }, { width: 22 }, { width: 22 }];

      // Title block
      ws.mergeCells('A1:D1');
      const titleRow = ws.getRow(1);
      titleRow.getCell(1).value = `TCOS Activity Report — ${activity.name}`;
      titleRow.getCell(1).font  = { bold: true, size: 16, color: { argb: 'FF1B2A4A' }, name: 'Arial' };
      titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
      titleRow.height = 36;

      ws.mergeCells('A2:D2');
      ws.getRow(2).getCell(1).value = `Exported: ${exportedAt}  |  Price: ฿${activity.price.toLocaleString()}  |  Capacity: ${activity.seat_capacity}`;
      ws.getRow(2).getCell(1).font  = { italic: true, size: 10, color: { argb: 'FF6B7280' }, name: 'Arial' };
      ws.getRow(2).height = 18;

      ws.getRow(3).height = 10;

      // KPI header
      const kpiHeader = ws.addRow(['Metric', 'Value', 'Metric', 'Value']);
      styleHeader(kpiHeader);

      // KPI rows
      const fillRate    = activity.seat_capacity > 0
        ? ((statuses.PAID + statuses.JOINED) / activity.seat_capacity * 100).toFixed(1) + '%'
        : '—';
      const checkInRate = (statuses.PAID + statuses.JOINED) > 0
        ? (statuses.JOINED / (statuses.PAID + statuses.JOINED) * 100).toFixed(1) + '%'
        : '—';

      const kpis = [
        ['Total Registrations', registrations.length,             'Seat Fill Rate',       fillRate],
        ['PENDING',             statuses.PENDING,                  'PAID',                 statuses.PAID],
        ['JOINED (Checked In)', statuses.JOINED,                   'CANCELLED',            statuses.CANCELLED],
        ['Total Revenue (฿)',   revenue.toLocaleString(),           'Avg per Paid Seat',    statuses.PAID + statuses.JOINED > 0 ? `฿${(revenue / (statuses.PAID + statuses.JOINED)).toFixed(0)}` : '—'],
        ['Days with Check-ins', attendanceDates.length,            'Total Check-ins',       totalCheckins],
        ['Check-in Rate',       checkInRate,                       'Remaining Seats',       activity.seat_capacity - (statuses.PAID + statuses.JOINED)],
      ];

      kpis.forEach((row, i) => {
        const r = ws.addRow(row);
        r.height = 20;
        r.getCell(1).font = { bold: true, name: 'Arial', size: 10 };
        r.getCell(3).font = { bold: true, name: 'Arial', size: 10 };
        r.getCell(2).alignment = { horizontal: 'center' };
        r.getCell(4).alignment = { horizontal: 'center' };
        if (i % 2 === 0) {
          [1,2,3,4].forEach(c => r.getCell(c).fill = STYLES.altRowFill);
        }
        r.eachCell(cell => { cell.border = STYLES.thinBorder; });
      });

      ws.getRow(ws.rowCount + 1).height = 10;

      // Schedule block
      if (activity.schedule?.length) {
        const schHeader = ws.addRow(['Schedule', 'Venue', 'Slot', 'Time']);
        styleSubHeader(schHeader);

        activity.schedule.forEach(day => {
          const dateStr = new Date(day.date).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' });
          if (!day.slots || day.slots.length === 0) {
            const r = ws.addRow([dateStr, day.venue, '—', '—']);
            styleDataRow(r, ws.rowCount, '');
          } else {
            day.slots.forEach((slot, si) => {
              const r = ws.addRow([
                si === 0 ? dateStr : '',
                si === 0 ? day.venue : '',
                slot.title,
                `${slot.start_time} – ${slot.end_time}`,
              ]);
              styleDataRow(r, ws.rowCount, '');
            });
          }
        });
      }

      // Group breakdown
      if (registrations.some(r => r.group_name)) {
        ws.getRow(ws.rowCount + 1).height = 10;
        const grpHeader = ws.addRow(['Group Name', 'Count', '', '']);
        styleSubHeader(grpHeader);

        const groups = {};
        registrations.forEach(r => {
          if (r.group_name) groups[r.group_name] = (groups[r.group_name] || 0) + 1;
        });
        Object.entries(groups).sort(([,a],[,b]) => b-a).forEach(([name, count], i) => {
          const r = ws.addRow([name, count, '', '']);
          styleDataRow(r, i, '');
          r.getCell(2).alignment = { horizontal: 'center' };
        });
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 2: All Registrations
    // ════════════════════════════════════════════════════════════════════════
    {
      const ws = wb.addWorksheet('📋 Registrations', { properties: { tabColor: { argb: 'FF0E7490' } } });

      // Build dynamic columns: fixed cols + one per extra_question
      const fixedHeaders = [
        'No.', 'First Name', 'Last Name', 'Nickname',
        'Email', 'Phone', 'Gender',
        'Status', 'Group', 'Registered At',
      ];
      const questionHeaders = activity.extra_questions.map(q => q.question_text);
      const allHeaders = [...fixedHeaders, ...questionHeaders];

      ws.columns = allHeaders.map((_, i) => ({
        width: i === 0 ? 6 : i >= fixedHeaders.length ? 20 : 16,
      }));

      const headerRow = ws.addRow(allHeaders);
      styleHeader(headerRow);
      ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }];

      registrations.forEach((reg, idx) => {
        const user = userMap[reg.user_id] || {};
        const answerMap = Object.fromEntries((reg.custom_answers || []).map(a => [a.question_id, a.answer]));
        const questionAnswers = activity.extra_questions.map(q => answerMap[q.question_id] || '—');

        const rowData = [
          idx + 1,
          user.first_name || '—',
          user.last_name  || '—',
          user.nickname   || '—',
          user.email      || '—',
          user.phone      || '—',
          user.gender     || '—',
          reg.status,
          reg.group_name  || '—',
          reg.registered_at ? new Date(reg.registered_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '—',
          ...questionAnswers,
        ];

        const row = ws.addRow(rowData);
        styleDataRow(row, idx + 1, reg.status);

        // Status cell colour
        const statusCell = row.getCell(8);
        const statusFills = { PAID: STYLES.paidFill, JOINED: STYLES.joinedFill, PENDING: STYLES.pendingFill };
        if (statusFills[reg.status]) {
          statusCell.fill = statusFills[reg.status];
          statusCell.font = { bold: true, size: 10, name: 'Arial' };
        }
        statusCell.alignment = { horizontal: 'center' };
      });

      autoWidth(ws);

      // Add auto-filter on header row
      ws.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + allHeaders.length)}1` };
    }

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 3: Attendance (per-day check-in grid)
    // ════════════════════════════════════════════════════════════════════════
    {
      const ws = wb.addWorksheet('✅ Attendance', { properties: { tabColor: { argb: 'FF166534' } } });

      if (attendanceDates.length === 0) {
        ws.addRow(['No check-in data yet.']).getCell(1).font = { italic: true, color: { argb: 'FF6B7280' } };
      } else {
        // Build a set of all users who checked in on any day
        const allCheckedInIds = [...new Set(Object.values(attendanceMap).flat())];

        const headers = ['No.', 'Full Name', 'Nickname', 'Phone', ...attendanceDates, 'Total Days'];
        ws.columns = headers.map((_, i) => ({
          width: i === 0 ? 6 : i < 4 ? 18 : 14,
        }));

        const headerRow = ws.addRow(headers);
        styleHeader(headerRow);
        ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 4 }];

        // Sub-header: show day-of-week under each date
        const subHeaders = ['', '', '', '', ...attendanceDates.map(d => {
          const day = new Date(d).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
          return day;
        }), ''];
        const subRow = ws.addRow(subHeaders);
        styleSubHeader(subRow);

        allCheckedInIds.forEach((uid, idx) => {
          const user     = userMap[uid] || {};
          const dayCells = attendanceDates.map(date => {
            const list = attendanceMap[date];
            return Array.isArray(list) && list.includes(uid) ? '✓' : '—';
          });
          const totalDays = dayCells.filter(v => v === '✓').length;

          const row = ws.addRow([
            idx + 1,
            user.first_name ? `${user.first_name} ${user.last_name}` : uid,
            user.nickname || '—',
            user.phone    || '—',
            ...dayCells,
            totalDays,
          ]);

          styleDataRow(row, idx + 1, '');
          // Centre the tick/dash cells
          for (let c = 5; c <= 4 + attendanceDates.length; c++) {
            row.getCell(c).alignment = { horizontal: 'center' };
            if (row.getCell(c).value === '✓') {
              row.getCell(c).fill = STYLES.paidFill;
              row.getCell(c).font = { bold: true, color: { argb: 'FF166534' }, name: 'Arial' };
            }
          }
          // Total days cell
          row.getCell(5 + attendanceDates.length).alignment = { horizontal: 'center' };
          row.getCell(5 + attendanceDates.length).font = { bold: true, name: 'Arial' };
        });

        // Summary footer: count per day
        ws.getRow(ws.rowCount + 1).height = 8;
        const totals = ['', 'Daily Total', '', '', ...attendanceDates.map(d => {
          const arr = attendanceMap[d];
          return Array.isArray(arr) ? arr.length : 0;
        }), totalCheckins];
        const totalRow = ws.addRow(totals);
        totalRow.eachCell(cell => {
          cell.font   = { bold: true, name: 'Arial', size: 10 };
          cell.fill   = STYLES.subHeaderFill;
          cell.font   = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial' };
          cell.border = STYLES.thinBorder;
          cell.alignment = { horizontal: 'center' };
        });
        totalRow.getCell(2).alignment = { horizontal: 'left' };
        totalRow.height = 22;

        autoWidth(ws, 8, 20);
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 4: Payments
    // ════════════════════════════════════════════════════════════════════════
    {
      const ws = wb.addWorksheet('💳 Payments', { properties: { tabColor: { argb: 'FF5B21B6' } } });

      const headers = ['No.', 'Full Name', 'Nickname', 'Email', 'Phone', 'Amount (฿)', 'Status', 'Verified At'];
      ws.columns = headers.map((_, i) => ({ width: i === 0 ? 6 : i === 5 ? 14 : 20 }));

      const headerRow = ws.addRow(headers);
      styleHeader(headerRow);
      ws.views = [{ state: 'frozen', ySplit: 1 }];

      let totalRevenue = 0;
      payments.forEach((pay, idx) => {
        const user = userMap[pay.user_id] || {};
        totalRevenue += pay.amount || 0;
        const row = ws.addRow([
          idx + 1,
          user.first_name ? `${user.first_name} ${user.last_name}` : '—',
          user.nickname || '—',
          user.email    || '—',
          user.phone    || '—',
          pay.amount,
          pay.status,
          pay.verified_at ? new Date(pay.verified_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : '—',
        ]);
        styleDataRow(row, idx + 1, '');
        row.getCell(6).alignment = { horizontal: 'right' };
        row.getCell(7).alignment = { horizontal: 'center' };
        if (pay.status === 'VERIFIED') row.getCell(7).fill = STYLES.paidFill;
      });

      // Total row
      ws.getRow(ws.rowCount + 1).height = 8;
      const totalRow = ws.addRow(['', 'TOTAL', '', '', '', totalRevenue, '', '']);
      totalRow.getCell(2).font = { bold: true, name: 'Arial', size: 11 };
      totalRow.getCell(6).font = { bold: true, name: 'Arial', size: 11 };
      totalRow.getCell(6).alignment = { horizontal: 'right' };
      totalRow.eachCell(cell => { cell.border = STYLES.thinBorder; cell.fill = STYLES.altRowFill; });
      totalRow.height = 22;

      autoWidth(ws);
      ws.autoFilter = { from: 'A1', to: 'H1' };
    }

    // ════════════════════════════════════════════════════════════════════════
    // SHEET 5: Demographics
    // ════════════════════════════════════════════════════════════════════════
    {
      const ws = wb.addWorksheet('👥 Demographics', { properties: { tabColor: { argb: 'FF92400E' } } });
      ws.columns = [{ width: 26 }, { width: 14 }, { width: 14 }, { width: 14 }];

      // Gender breakdown
      const genderHeader = ws.addRow(['Gender', 'Count', 'Percentage', '']);
      styleHeader(genderHeader);

      const genders = {};
      const totalNonCancelled = registrations.filter(r => r.status !== 'CANCELLED').length;
      users.forEach(u => { genders[u.gender] = (genders[u.gender] || 0) + 1; });

      Object.entries(genders).sort(([,a],[,b]) => b-a).forEach(([gender, count], i) => {
        const pct = totalNonCancelled > 0 ? ((count / totalNonCancelled) * 100).toFixed(1) + '%' : '—';
        const row = ws.addRow([gender, count, pct, '']);
        styleDataRow(row, i, '');
        row.getCell(2).alignment = { horizontal: 'center' };
        row.getCell(3).alignment = { horizontal: 'center' };
      });

      ws.getRow(ws.rowCount + 1).height = 12;

      // Interest tags breakdown
      const tagHeader = ws.addRow(['Interest Tag', 'Count', 'Percentage', '']);
      styleSubHeader(tagHeader);

      const tags = {};
      users.forEach(u => (u.interests || []).forEach(t => { tags[t] = (tags[t] || 0) + 1; }));

      if (Object.keys(tags).length === 0) {
        ws.addRow(['No interest data.', '', '', '']).getCell(1).font = { italic: true, color: { argb: 'FF6B7280' } };
      } else {
        Object.entries(tags).sort(([,a],[,b]) => b-a).slice(0, 20).forEach(([tag, count], i) => {
          const pct = users.length > 0 ? ((count / users.length) * 100).toFixed(1) + '%' : '—';
          const row = ws.addRow([tag, count, pct, '']);
          styleDataRow(row, i, '');
          row.getCell(2).alignment = { horizontal: 'center' };
          row.getCell(3).alignment = { horizontal: 'center' };
        });
      }

      ws.getRow(ws.rowCount + 1).height = 12;

      // Education breakdown (if any users have education_level set)
      const eduUsers = users.filter(u => u.education_level);
      if (eduUsers.length > 0) {
        const eduHeader = ws.addRow(['Education Level', 'Count', 'Institution Sample', '']);
        styleSubHeader(eduHeader);

        const edu = {};
        eduUsers.forEach(u => {
          if (!edu[u.education_level]) edu[u.education_level] = { count: 0, inst: u.institution };
          edu[u.education_level].count++;
        });
        Object.entries(edu).sort(([,a],[,b]) => b.count-a.count).forEach(([level, { count, inst }], i) => {
          const row = ws.addRow([level, count, inst || '—', '']);
          styleDataRow(row, i, '');
          row.getCell(2).alignment = { horizontal: 'center' };
        });
      }
    }

    // ── Write workbook to buffer ───────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename  = `TCOS_${safeActName}_${timestamp}.xlsx`;

    return { buffer, filename };
  }
}

module.exports = EventHelper;
