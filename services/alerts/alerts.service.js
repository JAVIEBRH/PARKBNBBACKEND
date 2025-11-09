import Alert, {
  ALERT_CATEGORY,
  ALERT_SEVERITY,
  ALERT_STATUS,
} from '../../models/Alert.js';
import { NotFoundError } from '../../utils/errors.js';
import { getPaginationParams } from '../../utils/pagination.js';

export const createAlert = async (payload) => {
  const alert = await Alert.create({
    title: payload.title,
    message: payload.message,
    severity: payload.severity || ALERT_SEVERITY.MEDIUM,
    status: payload.status || ALERT_STATUS.OPEN,
    category: payload.category || ALERT_CATEGORY.SYSTEM,
    metadata: payload.metadata || {},
    dueAt: payload.dueAt,
    tags: payload.tags || [],
  });

  return alert;
};

export const getAlerts = async (query = {}) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }
  if (query.severity) {
    filter.severity = query.severity;
  }
  if (query.category) {
    filter.category = query.category;
  }
  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { message: { $regex: query.search, $options: 'i' } },
      { tags: { $regex: query.search, $options: 'i' } },
    ];
  }

  const [alerts, total, statusSummary, severitySummary] = await Promise.all([
    Alert.find(filter)
      .populate('metadata.booking', 'code listing startDate endDate status')
      .populate('metadata.payout', 'amount status scheduledFor')
      .populate('metadata.incident', 'title status')
      .populate('acknowledgedBy', 'firstName lastName')
      .populate('resolvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Alert.countDocuments(filter),
    Alert.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Alert.aggregate([
      { $match: filter },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]),
  ]);

  return {
    alerts,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    summary: {
      byStatus: statusSummary.reduce(
        (acc, item) => ({ ...acc, [item._id]: item.count }),
        {}
      ),
      bySeverity: severitySummary.reduce(
        (acc, item) => ({ ...acc, [item._id]: item.count }),
        {}
      ),
    },
  };
};

export const getAlertById = async (id) => {
  const alert = await Alert.findById(id)
    .populate('metadata.booking', 'code listing startDate endDate status')
    .populate('metadata.payout', 'amount status scheduledFor')
    .populate('metadata.incident', 'title status')
    .populate('acknowledgedBy', 'firstName lastName')
    .populate('resolvedBy', 'firstName lastName')
    .lean();

  if (!alert) {
    throw new NotFoundError('Alerta no encontrada');
  }

  return alert;
};

export const updateAlertStatus = async (id, { status, userId }) => {
  const alert = await Alert.findById(id);

  if (!alert) {
    throw new NotFoundError('Alerta no encontrada');
  }

  const now = new Date();

  if (status === ALERT_STATUS.ACKNOWLEDGED) {
    alert.status = ALERT_STATUS.ACKNOWLEDGED;
    alert.acknowledgedAt = now;
    alert.acknowledgedBy = userId;
  } else if (status === ALERT_STATUS.RESOLVED) {
    alert.status = ALERT_STATUS.RESOLVED;
    alert.resolvedAt = now;
    alert.resolvedBy = userId;
  } else {
    alert.status = ALERT_STATUS.OPEN;
    alert.acknowledgedAt = undefined;
    alert.acknowledgedBy = undefined;
    alert.resolvedAt = undefined;
    alert.resolvedBy = undefined;
  }

  await alert.save();
  return alert;
};

export const bulkAcknowledgeAlerts = async (ids = [], userId) => {
  if (!ids.length) return { modifiedCount: 0 };

  const result = await Alert.updateMany(
    { _id: { $in: ids } },
    {
      status: ALERT_STATUS.ACKNOWLEDGED,
      acknowledgedAt: new Date(),
      acknowledgedBy: userId,
    }
  );

  return { modifiedCount: result.modifiedCount };
};

export const deleteAlert = async (id) => {
  const alert = await Alert.findById(id);

  if (!alert) {
    throw new NotFoundError('Alerta no encontrada');
  }

  await alert.deleteOne();
  return { success: true };
};


