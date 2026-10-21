/** Спецсимволы для правила пароля RR */
export const PASSWORD_SPECIAL_CHARS = '!@#$%&';

const RULES = [
  { id: 'minLength', label: 'Минимум 8 символов' },
  { id: 'upperLower', label: 'Заглавная и строчная английские буквы' },
  { id: 'hasDigit', label: 'Хотя бы одна цифра' },
  { id: 'hasSpecial', label: 'Хотя бы один символ (! @ # $ % &)' },
];

export function getPasswordRulesState(password) {
  const p = String(password || '');

  return {
    minLength: p.length >= 8,
    upperLower: /[a-z]/.test(p) && /[A-Z]/.test(p),
    hasDigit: /\d/.test(p),
    hasSpecial: /[!@#$%&]/.test(p),
  };
}

export function isPasswordRulesValid(password) {
  const state = getPasswordRulesState(password);
  return state.minLength && state.upperLower && state.hasDigit && state.hasSpecial;
}

export function getPasswordRulesList(password) {
  const state = getPasswordRulesState(password);
  return RULES.map((rule) => ({
    ...rule,
    met: state[rule.id],
  }));
}
