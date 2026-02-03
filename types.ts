export enum CourseStatus {
  Active = 'Active',
  Inactive = 'Inactive',
}

export enum CourseModality {
  Online = 'Online',
  Presencial = 'Presencial',
  Hybrid = 'Hybrid',
}

export interface CountryConfig {
  code: string; // Código ISO (MX, PE) - Clave Primaria
  name: string; // México
  currency: string; // MXN
  phonePrefix: string; // +52
  flag: string; // 🇲🇽 Emoji
  isActive: boolean;
}

export interface Course {
  sku: string; // Máx 20 caracteres
  name: string; // Máx 200 caracteres
  description: string; // Mín 50 caracteres
  benefits: string[]; // Mín 3 elementos
  instructor: string;
  instructorBio?: string;
  duration: string; // ej: "40 horas"
  modality: CourseModality;
  syllabusLink?: string;
  mediaUrl?: string; // Imagen o Video
  status: CourseStatus;
  sortOrder: number;
}

export interface Pricing {
  sku: string;
  country: string; // Código ISO: MX, PE, CO
  currency: string;
  price: number;
  promoPrice?: number;
  promoStartDate?: string; // Fecha ISO
  promoEndDate?: string; // Fecha ISO
  isActive: boolean;
}

export interface PaymentLink {
  id: string;
  sku: string;
  country: string;
  url: string;
  paymentMethods: string[]; // ['Tarjeta de Crédito', 'Efectivo', 'Transferencia']
  instructions?: string;
  isActive: boolean;
}

// --- MÓDULO 4: PROFESIONES ---
export interface Profession {
  id: string;
  name: string;
}

export interface CourseProfessionRule {
  sku: string;
  professionId: string;
  isAllowed: boolean;
  requiresCertification: boolean;
  notes?: string;
}

export interface PipelineStage {
  id: string;
  order: number;
  name: string;
  scriptTemplate: string;
  requiredInput: string | null; // Esto ahora enlaza a ContactProperty.key
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface Deal {
  id: string;
  customerName: string;
  stageId: string;
  value: number;
  currency: string; // Added currency field
  lastInteraction: string;
  chatHistory: ChatMessage[];
  capturedData: Record<string, any>; // Key (propiedad) : Valor
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

// --- MÓDULO 9: DATOS DE USUARIO (PROPIEDADES DE CONTACTO) ---
export type PropertyType = 'Text' | 'Number' | 'Select' | 'Email' | 'File';

export interface ContactProperty {
  id: string;
  label: string; // Etiqueta legible "Correo Electrónico"
  key: string; // Clave del sistema "email"
  type: PropertyType;
  description: string; // Contexto para la IA: "Debe ser un formato válido con @"
}

export interface AgentConfig {
  name: string;
  tone: 'Friendly' | 'Professional' | 'Urgent';
  model: string;
}

// Estado Global del Store
export interface AppState {
  isLoading: boolean; // Estado de carga inicial
  theme: 'light' | 'dark';
  countries: CountryConfig[];
  courses: Course[];
  prices: Pricing[];
  paymentLinks: PaymentLink[];
  
  professionsCatalog: Profession[];
  professionRules: CourseProfessionRule[];

  pipeline: PipelineStage[];
  contactProperties: ContactProperty[]; // Estado del Módulo 9
  deals: Deal[];
  activeSandboxDealId: string | null; // Persistencia de la sesión de Sandbox
  navigatedDealId: string | null; // ID del deal seleccionado para navegación entre módulos
  faqs: FAQ[];
  config: AgentConfig;
  updateState: (key: keyof AppState, value: any) => void;
  deleteItem: (key: keyof AppState, id: string) => void;
  saveDeal: (deal: Deal) => Promise<void>; // Método optimizado para chat
}