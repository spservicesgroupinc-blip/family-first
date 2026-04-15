export interface CaseFile {
  id: string;
  name: string;
  type: string;
  content: string; // Text content for display/preview
  inlineData?: {   // For binary files (PDFs, Images)
    mimeType: string;
    data: string;
  };
  dateAdded: number;
  summary?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
  citations?: string[]; // URLs from grounding
}

export type ViewMode = 'dashboard' | 'assistant' | 'research' | 'drafting' | 'files' | 'profile' | 'clients' | 'client-intake' | 'client-detail';

export interface ResearchResult {
  query: string;
  answer: string;
  sources: { title: string; uri: string }[];
}

// ────────────────────────────────────────────────
// Client Intake System Types
// ────────────────────────────────────────────────

export type CaseType =
  | 'divorce'
  | 'legal_separation'
  | 'custody_modification'
  | 'support_modification'
  | 'paternity'
  | 'domestic_violence'
  | 'adoption'
  | 'guardianship'
  | 'contempt_enforcement'
  | 'appeal'
  | 'other';

export type CustodyType =
  | 'joint'
  | 'sole_mother'
  | 'sole_father'
  | 'split'
  | 'none_established';

export type EmploymentStatus =
  | 'employed_full_time'
  | 'employed_part_time'
  | 'self_employed'
  | 'unemployed'
  | 'disabled'
  | 'retired'
  | 'student';

export interface SpousePartner {
  fullName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  currentAddress: string;
  isAddressSameAsClient: boolean;
  dateOfMarriage: string;
  dateOfSeparation: string;
  opposingCounselName: string;
  opposingCounselContact: string;
  opposingCounselFirm: string;
}

export interface Child {
  id: string;
  fullName: string;
  dateOfBirth: string;
  age: number; // calculated from DOB
  currentCustody: CustodyType;
  specialNeeds: string;
  schoolName: string;
  pediatricianName: string;
  notes: string;
}

export interface FinancialOverview {
  clientEmploymentStatus: EmploymentStatus;
  clientEmployer: string;
  clientMonthlyIncome: number | '';
  clientPayFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | '';
  spouseEmploymentStatus: EmploymentStatus;
  spouseEmployer: string;
  spouseMonthlyIncome: number | '';
  spousePayFrequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | '';
  assets: string; // narrative description
  debts: string; // narrative description
  bankAccounts: string;
  realEstate: string;
  vehicles: string;
  retirementAccounts: string;
  creditCardDebt: number | '';
  mortgageBalance: number | '';
  otherDebts: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
}

export interface CaseInfo {
  caseType: CaseType;
  caseNumber: string;
  countyFiled: string;
  judgeAssigned: string;
  courtDivision: string;
  urgentMatters: string[];
  opposingCounselInfo: string;
  caseNotes: string;
  priorityMatters: string;
  desiredOutcome: string;
  previousFilings: string;
  mediationHistory: string;
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  middleName: string;
  dateOfBirth: string;
  ssnLast4: string;
  phone: string;
  altPhone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  mailingAddress: string;
  mailingCity: string;
  mailingState: string;
  mailingZip: string;
  isMailingSameAsPhysical: boolean;
  preferredContactMethod: 'phone' | 'email' | 'text';
  howDidYouHearAboutUs: string;
}

export interface ClientProfile {
  id: string;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  status: 'active' | 'pending' | 'archived' | 'closed';
  personalInfo: PersonalInfo;
  spouseInfo: SpousePartner;
  children: Child[];
  caseInfo: CaseInfo;
  financialInfo: FinancialOverview;
  emergencyContact: EmergencyContact;
  referralSource: string;
  retainerAmount: number | '';
  retainerPaid: boolean;
  notes: string;
}

export interface ClientSummary {
  id: string;
  fullName: string;
  caseType: CaseType;
  status: 'active' | 'pending' | 'archived' | 'closed';
  createdAt: number;
  updatedAt: number;
  spouseName: string;
  childrenCount: number;
  caseNumber: string;
  countyFiled: string;
}

export interface IntakeFormDraft {
  personalInfo: Partial<PersonalInfo>;
  spouseInfo: Partial<SpousePartner>;
  children: Child[];
  caseInfo: Partial<CaseInfo>;
  financialInfo: Partial<FinancialOverview>;
  emergencyContact: Partial<EmergencyContact>;
  notes: string;
}