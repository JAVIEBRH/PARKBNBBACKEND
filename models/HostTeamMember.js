import mongoose from 'mongoose';

export const TEAM_ROLES = {
  COHOST: 'cohost',
  MANAGER: 'manager',
  STAFF: 'staff',
};

export const TEAM_STATUS = {
  INVITED: 'invited',
  ACTIVE: 'active',
  REVOKED: 'revoked',
};

export const TEAM_PERMISSIONS = [
  'manageListings',
  'manageBookings',
  'manageFinance',
  'manageMessages',
  'viewAnalytics',
  'manageAutomations',
  'manageDocuments',
];

const hostTeamMemberSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(TEAM_ROLES),
      default: TEAM_ROLES.COHOST,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TEAM_STATUS),
      default: TEAM_STATUS.INVITED,
      index: true,
    },
    permissions: [
      {
        type: String,
        enum: TEAM_PERMISSIONS,
      },
    ],
    invitationToken: {
      type: String,
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: Date,
    revokedAt: Date,
    lastActiveAt: Date,
    notes: String,
    auditTrail: [
      {
        action: String,
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        payload: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
  }
);

hostTeamMemberSchema.index({ host: 1, email: 1 }, { unique: true });

const HostTeamMember = mongoose.model('HostTeamMember', hostTeamMemberSchema);

export default HostTeamMember;


