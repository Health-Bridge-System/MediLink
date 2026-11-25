// Rule-based CDSS: plain JavaScript checks that run inside Express.
// Each rule returns alert drafts { severity, message } — the service saves them.

export function labResultRules(serviceName, results) {
  const alerts = [];

  for (const r of results.filter((r) => r.flag === 'CRITICAL')) {
    alerts.push({
      severity: 'CRITICAL',
      message: `Critical value: ${r.testName} ${r.value} ${r.unit ?? ''} (ref ${r.normalRange ?? 'n/a'}). Notify the ordering physician now.`.replace(/\s+/g, ' '),
    });
  }

  const abnormal = results.filter((r) => r.flag === 'HIGH' || r.flag === 'LOW');
  if (abnormal.length) {
    const list = abnormal.map((r) => `${r.testName} ${r.flag === 'HIGH' ? '↑' : '↓'}`).join(', ');
    alerts.push({
      severity: abnormal.length >= 2 ? 'MEDIUM' : 'LOW',
      message: `${serviceName}: ${abnormal.length} abnormal value${abnormal.length > 1 ? 's' : ''} (${list}).`,
    });
  }

  return alerts;
}

// Same service ordered for the same patient within the last 24 hours.
export function duplicateOrderRule(serviceName, previous) {
  if (!previous) return null;
  const hours = Math.max(1, Math.round((Date.now() - new Date(previous.createdAt).getTime()) / 36e5));
  return {
    severity: 'MEDIUM',
    message: `Possible duplicate: ${serviceName} was already ordered ${hours}h ago (order #${previous.orderId}).`,
  };
}
