/**
 * Paleta de Cores Profissionais
 * Sistema de Design - Caderninho Digital
 */

export const colors = {
  // Backgrounds
  bg: {
    primary: '#f5f6f8',
    secondary: '#ffffff',
    card: '#ffffff',
    hover: '#fafbfc',
  },

  // Textos
  text: {
    primary: '#1a1d23',
    secondary: '#4a5568',
    muted: '#718096',
    disabled: '#a0aec0',
  },

  // Bordas
  border: {
    default: '#e2e8f0',
    hover: '#cbd5e0',
  },

  // Cores de ação
  primary: {
    default: '#2d3748',
    hover: '#1a202c',
    light: '#4a5568',
  },

  accent: {
    default: '#3182ce',
    hover: '#2c5282',
    light: '#4299e1',
  },

  // Status
  success: {
    default: '#38a169',
    light: '#48bb78',
    bg: '#f0fff4',
  },

  warning: {
    default: '#d69e2e',
    light: '#ecc94b',
    bg: '#fffff0',
  },

  danger: {
    default: '#e53e3e',
    light: '#fc8181',
    bg: '#fff5f5',
  },

  info: {
    default: '#3182ce',
    light: '#63b3ed',
    bg: '#ebf8ff',
  },
};

// Mapeamento de cores antigas para novas (para migração)
export const colorMigration = {
  '#007bff': colors.accent.default,      // Azul antigo -> Azul profissional
  '#0056b3': colors.accent.hover,        // Azul hover antigo -> Azul hover novo
  '#28a745': colors.success.default,     // Verde antigo -> Verde novo
  '#1e7e34': colors.success.light,       // Verde hover antigo -> Verde hover novo
  '#dc3545': colors.danger.default,      // Vermelho antigo -> Vermelho novo
  '#c82333': colors.danger.light,        // Vermelho hover antigo -> Vermelho hover novo
  '#ffc107': colors.warning.default,     // Amarelo antigo -> Amarelo novo
  '#e0a800': colors.warning.light,       // Amarelo hover antigo -> Amarelo hover novo
  '#6c757d': colors.text.secondary,      // Cinza antigo -> Cinza novo
  '#545b62': colors.text.muted,          // Cinza hover antigo -> Cinza hover novo
};

export default colors;
