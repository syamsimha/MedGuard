export interface AuthUser {
  id: string;
  name: string;
  role: string;
  email: string;
  department: string;
  avatarInitials: string;
  accountType?: 'Doctor' | 'Pharmacist' | 'Clinic';
  clinicName?: string;
}

export interface DemoCredential {
  accountType: 'Doctor' | 'Pharmacist' | 'Clinic';
  idOrEmail: string;
  password: string;
  user: AuthUser;
}

export const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    accountType: 'Doctor',
    idOrEmail: 'dr.vance@medguard.org',
    password: 'MedGuard@2026!',
    user: {
      id: 'DOC-8021',
      name: 'Dr. Christopher Vance, MD',
      role: 'Attending Cardiologist',
      email: 'dr.vance@medguard.org',
      department: 'Inpatient Cardiology & Critical Care',
      avatarInitials: 'CV',
      accountType: 'Doctor',
    },
  },
  {
    accountType: 'Pharmacist',
    idOrEmail: 'pharm.sharma@medguard.org',
    password: 'MedGuard@2026!',
    user: {
      id: 'PHARM-401',
      name: 'Pharm. Rajesh Sharma, PharmD',
      role: 'Lead Clinical Pharmacist',
      email: 'pharm.sharma@medguard.org',
      department: 'Clinical Pharmacotherapy Division',
      avatarInitials: 'RS',
      accountType: 'Pharmacist',
    },
  },
  {
    accountType: 'Clinic',
    idOrEmail: 'clinic.admin@medguard.org',
    password: 'MedGuard@2026!',
    user: {
      id: 'CLINIC-101',
      name: 'St. Jude Metropolitan Clinic',
      role: 'Clinic Administrator',
      email: 'clinic.admin@medguard.org',
      department: 'Clinical Quality & Administration',
      avatarInitials: 'SJ',
      accountType: 'Clinic',
      clinicName: 'St. Jude Metropolitan Clinic',
    },
  },
];
