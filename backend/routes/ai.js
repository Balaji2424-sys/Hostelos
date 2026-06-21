const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const prisma = new PrismaClient();
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const callGroq = async (systemPrompt, userPrompt) => {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 1024,
    temperature: 0.3
  });
  return completion.choices[0]?.message?.content || '';
};

// Admin chat assistant — natural language queries
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message, context } = req.body;

    // Pull live context
    const now = new Date();
    const [stats, recentPayments, openComplaints] = await Promise.all([
      prisma.bed.aggregate({ _count: true }),
      prisma.payment.findMany({
        where: { month: now.getMonth() + 1, year: now.getFullYear() },
        include: { tenant: true }, take: 20
      }),
      prisma.complaint.findMany({ where: { status: 'OPEN' }, take: 10 })
    ]);

    const occupiedBeds = await prisma.bed.count({ where: { isOccupied: true } });
    const totalBeds = stats._count;
    const paidCount = recentPayments.filter(p => p.status === 'PAID').length;
    const unpaidCount = recentPayments.filter(p => p.status !== 'PAID').length;

    const systemPrompt = `You are an intelligent hostel management assistant. You help hostel owners manage their properties.

Current hostel data snapshot:
- Total beds: ${totalBeds}, Occupied: ${occupiedBeds}, Vacant: ${totalBeds - occupiedBeds}
- Occupancy rate: ${totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0}%
- This month payments: ${paidCount} paid, ${unpaidCount} unpaid
- Open complaints: ${openComplaints.length}

Be concise, helpful, and data-driven. If you need data you don't have, say so. Always respond in a friendly professional tone.`;

    const response = await callGroq(systemPrompt, message);
    res.json({ reply: response });
  } catch (err) {
    res.status(500).json({ error: err.message, reply: 'AI assistant is currently unavailable. Please check your Groq API key.' });
  }
});

// Payment risk analysis
router.get('/payment-risk', authenticate, async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { status: { in: ['ACTIVE', 'NOTICE_GIVEN'] } },
      include: {
        payments: { orderBy: { createdAt: 'desc' }, take: 6 }
      }
    });

    const tenantSummaries = tenants.map(t => ({
      name: t.name,
      phone: t.phone,
      overdueCount: t.payments.filter(p => p.status === 'OVERDUE').length,
      unpaidCount: t.payments.filter(p => p.status === 'UNPAID').length,
      totalDue: t.payments.reduce((s, p) => s + (p.dueAmount || 0), 0),
      lastPaymentDate: t.payments.find(p => p.status === 'PAID')?.paidDate || null
    }));

    const prompt = `Analyze these ${tenants.length} hostel tenant payment records and identify high-risk tenants (likely to default).

Tenant data: ${JSON.stringify(tenantSummaries.slice(0, 20))}

Return a JSON array of at most 5 high-risk tenants with fields: name, phone, riskLevel (HIGH/MEDIUM), reason.
Respond with only valid JSON array, no markdown.`;

    const response = await callGroq(
      'You are a financial risk analyst for a hostel. Return only valid JSON arrays. No explanation, no markdown.',
      prompt
    );

    let riskList = [];
    try { riskList = JSON.parse(response); } catch { riskList = []; }
    res.json({ riskTenants: riskList });
  } catch (err) {
    res.status(500).json({ error: err.message, riskTenants: [] });
  }
});

// Vacancy forecast
router.get('/vacancy-forecast', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);

    const [totalBeds, occupiedBeds, upcomingVacates] = await Promise.all([
      prisma.bed.count(),
      prisma.bed.count({ where: { isOccupied: true } }),
      prisma.tenant.findMany({
        where: { vacateDate: { gte: now, lte: in30 }, status: { in: ['ACTIVE', 'NOTICE_GIVEN', 'VACATING'] } },
        select: { name: true, vacateDate: true, rentAmount: true }
      })
    ]);

    const prompt = `Hostel data: ${occupiedBeds}/${totalBeds} beds occupied. 
Upcoming vacates in 30 days: ${JSON.stringify(upcomingVacates)}.

Give a brief forecast (3-4 sentences) covering:
1. Expected occupancy % after vacates
2. Expected revenue impact
3. Recommendation to fill vacancies

Be specific with numbers.`;

    const forecast = await callGroq(
      'You are a hostel business analyst. Give brief, data-driven forecasts.',
      prompt
    );

    res.json({
      currentOccupancy: occupiedBeds,
      totalBeds,
      upcomingVacates: upcomingVacates.length,
      forecastedOccupancy: occupiedBeds - upcomingVacates.length,
      forecast
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Smart email/message draft
router.post('/draft-message', authenticate, async (req, res) => {
  try {
    const { type, tenantId } = req.body;
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { payments: { orderBy: { createdAt: 'desc' }, take: 2 }, bed: { include: { room: true } } }
    });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const latestPayment = tenant.payments[0];
    const prompts = {
      RENT_REMINDER: `Write a polite rent reminder email to ${tenant.name} for Room ${tenant.bed.room.roomNumber}. Rent due: ₹${tenant.rentAmount}. ${latestPayment?.dueAmount > 0 ? `Outstanding: ₹${latestPayment.dueAmount}.` : ''} Keep it under 80 words, professional and friendly.`,
      PAYMENT_CONFIRM: `Write a payment confirmation email to ${tenant.name}. Amount received: ₹${latestPayment?.amount || tenant.rentAmount}. Room: ${tenant.bed.room.roomNumber}. Keep it under 60 words.`,
      VACATE_NOTICE: `Write a vacate acknowledgement email to ${tenant.name}. Their registered vacate date: ${tenant.vacateDate ? new Date(tenant.vacateDate).toDateString() : 'not set'}. Mention security deposit refund process. Under 80 words.`
    };

    const draft = await callGroq(
      'You are a professional hostel manager drafting polite, concise emails.',
      prompts[type] || prompts.RENT_REMINDER
    );
    res.json({ draft, tenantName: tenant.name, tenantEmail: tenant.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EB anomaly detection
router.get('/eb-anomaly', authenticate, async (req, res) => {
  try {
    const bills = await prisma.ebBill.findMany({
      include: { room: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    if (bills.length < 3) return res.json({ anomalies: [], message: 'Not enough data yet.' });

    const summary = bills.map(b => ({
      room: b.room.roomNumber,
      month: `${b.billingMonth}/${b.billingYear}`,
      units: b.unitsConsumed,
      bill: b.totalBill
    }));

    const prompt = `Analyze these electricity bills: ${JSON.stringify(summary.slice(0, 30))}.
Identify anomalies (rooms with unusually high consumption or sudden spikes).
Return JSON array: [{room, month, units, issue}]. Max 5 items. Only valid JSON, no markdown.`;

    const response = await callGroq(
      'You are an energy analyst. Return only valid JSON arrays.',
      prompt
    );

    let anomalies = [];
    try { anomalies = JSON.parse(response); } catch { anomalies = []; }
    res.json({ anomalies });
  } catch (err) {
    res.status(500).json({ error: err.message, anomalies: [] });
  }
});

module.exports = router;
