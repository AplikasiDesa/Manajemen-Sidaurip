
import { Timestamp } from "firebase/firestore";

export type Announcement = {
  id: string;
  title: string;
  content: string;
  publishDate: Timestamp;
  authorName: string;
};

export type News = {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  imageUrl: string;
  date: string;
  author: string;
  isHeadline?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type Complaint = {
  id: string;
  description: string;
  reporterName: string;
  reporterAddress: string;
  phoneNumber?: string;
  email?: string;
  submissionDate: Timestamp;
  summaryLLM: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords: string[];
  submitterAuthUid?: string;
  adminResponse?: string;
};

export type LetterSubmissionData = {
  requesterName: string;
  nik: string;
  letterType: string;
  formData: Record<string, any>;
  files?: { fieldName: string; file: File }[];
};

export type UploadedFile = {
  fieldName: string;
  fileName: string;
  fileId: string;
}

export type LetterSubmission = {
  id:string;
  requesterName: string;
  nik: string;
  phoneNumber?: string;
  email?: string;
  letterType: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing';
  formData: Record<string, any>;
  documentNumber?: string;
  fileLinks?: UploadedFile[];
  submissionData?: string;
  requestorAuthUid?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type Resident = {
  id: string;
  nik: string;
  noKk: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  age: string;
  placeOfBirth: string;
  address: string;
  rt: string;
  rw: string;
  kelurahan: string;
  relationshipToHeadOfFamily: string;
  maritalStatus: string;
  educationLevel: string;
  religion: string;
  occupation: string;
  bloodType: string;
  hasBirthCertificate: string;
  birthCertificateNumber: string;
  hasMarriageCertificate: string;
  marriageCertificateNumber: string;
  hasDivorceCertificate: string;
  divorceCertificateNumber: string;
  fatherName: string;
  motherName: string;
  createdAt?: any;
  updatedAt?: any;
};

export type CitizenProfile = {
  uid: string;
  phoneNumber: string;
  email: string;
  updatedAt: any;
};

export type KopSuratInfo = {
  letterheadImageUrl: string;
};

export type VillageLogoInfo = {
  logoImageUrl: string;
};

export type Official = {
  id: string;
  name: string;
  position: string;
  category: 'perangkat' | 'bpd' | 'rtrw';
  imageUrl?: string;
};
