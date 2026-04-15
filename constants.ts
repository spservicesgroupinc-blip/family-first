import { Gavel, Scale, FileText, MessageSquare, Search, Upload, Check, Download, Users, Settings } from 'lucide-react';
import { CaseType, CustodyType, EmploymentStatus } from './types';

export const Icons = {
  Gavel,
  Scale,
  Document: FileText,
  Chat: MessageSquare,
  Search,
  Upload,
  Check,
  Download,
  Users,
  Settings
};

// ────────────────────────────────────────────────
// Client Intake Form Constants
// ────────────────────────────────────────────────

export const CASE_TYPE_LABELS: Record<CaseType, string> = {
  divorce: 'Divorce / Dissolution of Marriage',
  legal_separation: 'Legal Separation',
  custody_modification: 'Custody Modification',
  support_modification: 'Child Support Modification',
  paternity: 'Paternity',
  domestic_violence: 'Domestic Violence / Protective Order',
  adoption: 'Adoption',
  guardianship: 'Guardianship',
  contempt_enforcement: 'Contempt / Enforcement',
  appeal: 'Appeal',
  other: 'Other',
};

export const CUSTODY_TYPE_LABELS: Record<CustodyType, string> = {
  joint: 'Joint Custody',
  sole_mother: 'Sole Custody (Mother)',
  sole_father: 'Sole Custody (Father)',
  split: 'Split Custody',
  none_established: 'None Established',
};

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  employed_full_time: 'Employed Full-Time',
  employed_part_time: 'Employed Part-Time',
  self_employed: 'Self-Employed',
  unemployed: 'Unemployed',
  disabled: 'Disabled',
  retired: 'Retired',
  student: 'Student',
};

export const INTAKE_FORM_STEPS = [
  { id: 'personal', label: 'Personal Info', shortLabel: 'Personal' },
  { id: 'spouse', label: 'Spouse / Partner', shortLabel: 'Spouse' },
  { id: 'children', label: 'Children', shortLabel: 'Children' },
  { id: 'case', label: 'Case Details', shortLabel: 'Case' },
  { id: 'financial', label: 'Financial', shortLabel: 'Financial' },
  { id: 'emergency', label: 'Emergency Contact', shortLabel: 'Emergency' },
  { id: 'review', label: 'Review & Submit', shortLabel: 'Review' },
] as const;

export const URGENT_MATTERS_OPTIONS = [
  'Temporary Custody Order',
  'Temporary Support Order',
  'Protective / Restraining Order',
  'Emergency Motion Filed',
  'Upcoming Hearing (within 30 days)',
  'Upcoming Mediation',
  'Discovery Deadline',
  'Contempt Hearing',
  'Contempt of Court',
  'Missing / Withholding Children',
  'Domestic Violence Incident',
  'Relocation Notice',
  'Substance Abuse Concern',
  'Child Endangerment',
  'Other',
] as const;

export const INDIANA_COUNTIES = [
  'Marion', 'Lake', 'Hamilton', 'Allen', 'St. Joseph',
  'Elkhart', 'Tippecanoe', 'Porter', 'Vanderburgh', 'Madison',
  'Monroe', 'Hendricks', 'Johnson', 'Howard', 'Floyd',
  'Clark', 'Bartholomew', 'Muncie', 'Vigo', 'Jefferson',
  'Other Indiana County', 'Out of State',
] as const;

export const DEFAULT_SPOUSE: Record<string, string> = {
  fullName: '',
  dateOfBirth: '',
  phone: '',
  email: '',
  currentAddress: '',
  dateOfMarriage: '',
  dateOfSeparation: '',
  opposingCounselName: '',
  opposingCounselContact: '',
  opposingCounselFirm: '',
};

export const DEFAULT_CHILD = {
  fullName: '',
  dateOfBirth: '',
  age: 0,
  currentCustody: 'none_established' as CustodyType,
  specialNeeds: '',
  schoolName: '',
  pediatricianName: '',
  notes: '',
};

export const INTAKE_STORAGE_KEY = 'ff_client_draft';
export const ACTIVE_CLIENT_KEY = 'ff_active_client';