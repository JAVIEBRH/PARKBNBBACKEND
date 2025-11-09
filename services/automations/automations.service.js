import MessageAutomation, {
  AUTOMATION_CHANNELS,
  AUTOMATION_STATUS,
  AUTOMATION_TRIGGERS,
} from '../../models/MessageAutomation.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

const sanitizeAutomation = (automation) => ({
  id: automation._id.toString(),
  name: automation.name,
  description: automation.description,
  status: automation.status,
  trigger: automation.trigger,
  schedule: automation.schedule,
  channels: automation.channels,
  template: automation.template,
  audience: automation.audience,
  conditions: automation.conditions,
  lastTriggeredAt: automation.lastTriggeredAt,
  createdAt: automation.createdAt,
  updatedAt: automation.updatedAt,
});

const VALID_AUDIENCES = ['all', 'newGuests', 'returning', 'highValue'];
const VALID_REFERENCES = ['checkin', 'checkout', 'booking_creation'];
const VALID_UNITS = ['minutes', 'hours', 'days'];
const VALID_DIRECTIONS = ['before', 'after'];

const extractVariables = (body = '') => {
  const matches = body.match(/{{(.*?)}}/g) || [];
  return Array.from(new Set(matches.map((token) => token.replace(/[{}]/g, '').trim())));
};

export const listAutomations = async (hostId) => {
  const automations = await MessageAutomation.find({ host: hostId })
    .sort({ createdAt: -1 })
    .lean();

  const sanitized = automations.map(sanitizeAutomation);
  const summary = sanitized.reduce(
    (acc, automation) => {
      acc.total += 1;
      if (automation.status === AUTOMATION_STATUS.ACTIVE) acc.active += 1;
      return acc;
    },
    { total: 0, active: 0 }
  );

  return {
    automations: sanitized,
    summary,
    metadata: {
      triggers: AUTOMATION_TRIGGERS,
      channels: AUTOMATION_CHANNELS,
      audiences: VALID_AUDIENCES,
      schedule: {
        units: VALID_UNITS,
        directions: VALID_DIRECTIONS,
        references: VALID_REFERENCES,
      },
    },
  };
};

const ensureValidPayload = (payload = {}) => {
  if (!payload.name) {
    throw new BadRequestError('El nombre de la automatización es obligatorio');
  }

  if (!Object.values(AUTOMATION_TRIGGERS).includes(payload.trigger)) {
    throw new BadRequestError('Trigger inválido');
  }

  if (payload.audience && !VALID_AUDIENCES.includes(payload.audience)) {
    throw new BadRequestError('Audiencia no soportada');
  }

  const schedule = {
    offset: Math.max(0, payload.schedule?.offset ?? 0),
    unit: VALID_UNITS.includes(payload.schedule?.unit) ? payload.schedule.unit : 'hours',
    direction: VALID_DIRECTIONS.includes(payload.schedule?.direction)
      ? payload.schedule.direction
      : 'before',
    reference: VALID_REFERENCES.includes(payload.schedule?.reference)
      ? payload.schedule.reference
      : 'checkin',
  };

  const channels =
    payload.channels?.length > 0
      ? payload.channels.filter((channel) => AUTOMATION_CHANNELS.includes(channel))
      : ['in_app'];

  const templateBody = payload.template?.body?.trim();
  if (!templateBody) {
    throw new BadRequestError('El cuerpo del mensaje es obligatorio');
  }

  return {
    name: payload.name.trim(),
    description: payload.description?.trim(),
    trigger: payload.trigger,
    schedule,
    channels,
    audience: payload.audience || 'all',
    template: {
      subject: payload.template?.subject?.trim(),
      body: templateBody,
      preview: payload.template?.preview,
      variables: extractVariables(templateBody),
    },
    conditions: payload.conditions || {},
  };
};

export const createAutomation = async ({ hostId, userId, payload }) => {
  const sanitizedPayload = ensureValidPayload(payload);

  const automation = await MessageAutomation.create({
    host: hostId,
    createdBy: userId,
    updatedBy: userId,
    status: AUTOMATION_STATUS.ACTIVE,
    ...sanitizedPayload,
  });

  return sanitizeAutomation(automation);
};

export const updateAutomation = async ({ automationId, hostId, userId, payload }) => {
  const automation = await MessageAutomation.findOne({ _id: automationId, host: hostId });
  if (!automation) {
    throw new NotFoundError('Automatización no encontrada');
  }

  const sanitizedPayload = ensureValidPayload({ ...automation.toObject(), ...payload });

  Object.assign(automation, sanitizedPayload, {
    updatedBy: userId,
  });

  await automation.save();
  return sanitizeAutomation(automation);
};

export const changeAutomationStatus = async ({ automationId, hostId, status, userId }) => {
  if (!Object.values(AUTOMATION_STATUS).includes(status)) {
    throw new BadRequestError('Estado inválido para la automatización');
  }

  const automation = await MessageAutomation.findOne({ _id: automationId, host: hostId });
  if (!automation) {
    throw new NotFoundError('Automatización no encontrada');
  }

  automation.status = status;
  automation.updatedBy = userId;
  await automation.save();

  return sanitizeAutomation(automation);
};

export const deleteAutomation = async ({ automationId, hostId }) => {
  const deletion = await MessageAutomation.deleteOne({ _id: automationId, host: hostId });
  if (!deletion.deletedCount) {
    throw new NotFoundError('Automatización no encontrada');
  }
  return { id: automationId, removed: true };
};


