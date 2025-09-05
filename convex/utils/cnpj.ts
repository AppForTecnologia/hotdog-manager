/**
 * Utilitários para validação e normalização de CNPJ
 * Implementação local com validação de dígitos verificadores
 */

/**
 * Remove todos os caracteres não numéricos do CNPJ
 * 
 * @param cnpj - CNPJ com ou sem formatação
 * @returns CNPJ apenas com números (14 dígitos)
 * 
 * @example
 * normalizeCnpj("12.345.678/0001-90") // "12345678000190"
 * normalizeCnpj("12345678000190") // "12345678000190"
 * normalizeCnpj("12 345 678/0001-90") // "12345678000190"
 */
export function normalizeCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

/**
 * Valida se um CNPJ é válido
 * Verifica formato (14 dígitos) e dígitos verificadores
 * 
 * @param cnpj - CNPJ a ser validado (com ou sem formatação)
 * @returns true se o CNPJ for válido, false caso contrário
 * 
 * @example
 * isValidCnpj("12.345.678/0001-90") // true
 * isValidCnpj("12345678000190") // true
 * isValidCnpj("11111111111111") // false (sequência inválida)
 * isValidCnpj("1234567890123") // false (13 dígitos)
 */
export function isValidCnpj(cnpj: string): boolean {
  // Normalizar o CNPJ
  const normalizedCnpj = normalizeCnpj(cnpj);
  
  // Verificar se tem exatamente 14 dígitos
  if (normalizedCnpj.length !== 14) {
    return false;
  }
  
  // Verificar se não é uma sequência de números iguais
  if (/^(\d)\1{13}$/.test(normalizedCnpj)) {
    return false;
  }
  
  // Calcular primeiro dígito verificador
  const firstDigit = calculateCnpjDigit(normalizedCnpj, 12);
  
  // Calcular segundo dígito verificador
  const secondDigit = calculateCnpjDigit(normalizedCnpj, 13);
  
  // Verificar se os dígitos verificadores estão corretos
  return (
    normalizedCnpj[12] === firstDigit.toString() &&
    normalizedCnpj[13] === secondDigit.toString()
  );
}

/**
 * Calcula um dígito verificador do CNPJ
 * 
 * @param cnpj - CNPJ normalizado (apenas números)
 * @param position - Posição do dígito a ser calculado (12 ou 13)
 * @returns Dígito verificador calculado
 */
function calculateCnpjDigit(cnpj: string, position: number): number {
  const weights = position === 12 
    ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < position; i++) {
    sum += parseInt(cnpj[i]) * weights[i];
  }
  
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

/**
 * Formata um CNPJ normalizado para o padrão XX.XXX.XXX/XXXX-XX
 * 
 * @param cnpj - CNPJ normalizado (14 dígitos)
 * @returns CNPJ formatado ou string vazia se inválido
 * 
 * @example
 * formatCnpj("12345678000190") // "12.345.678/0001-90"
 * formatCnpj("123") // ""
 */
export function formatCnpj(cnpj: string): string {
  const normalized = normalizeCnpj(cnpj);
  
  if (normalized.length !== 14) {
    return "";
  }
  
  return normalized.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

/**
 * Valida e normaliza um CNPJ
 * Combina as funções de validação e normalização
 * 
 * @param cnpj - CNPJ a ser validado e normalizado
 * @returns Objeto com informações de validação
 * 
 * @example
 * validateAndNormalizeCnpj("12.345.678/0001-90")
 * // { isValid: true, normalized: "12345678000190", formatted: "12.345.678/0001-90" }
 */
export function validateAndNormalizeCnpj(cnpj: string): {
  isValid: boolean;
  normalized: string;
  formatted: string;
} {
  const normalized = normalizeCnpj(cnpj);
  const isValid = isValidCnpj(normalized);
  const formatted = isValid ? formatCnpj(normalized) : "";
  
  return {
    isValid,
    normalized,
    formatted,
  };
}
