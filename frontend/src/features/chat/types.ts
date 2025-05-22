export interface RagScope {
  provinces?: string[];
  // In the future, you could add other scope types here:
  // years?: number[];
  // documentTypes?: string[];
}

export type Message = {
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
  isTyping?: boolean;
  displayedText?: string;
  scope?: RagScope; // New: To store the scope used for the message
};

export const ALL_PROVINCES = [
  'Jujuy',
  'La Nación Argentina',
  'La Rioja',
  'La Provincia Del Chubut',
  'Entre Rios',
  'Corrientes',
  'Neuquen',
  'Tucumán',
  'Santiago Del Estero',
  'Formosa',
  'Cordoba',
  'Santa Cruz',
  'Buenos Aires',
  'La Pampa',
  'La Provincia Del Chaco',
  'Tierra Del Fuego Antártida E Islas Del Atlántico Sur',
  'Rio Negro',
  'Catamarca',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Fe',
  'Misiones',
  'Mendoza',
];
