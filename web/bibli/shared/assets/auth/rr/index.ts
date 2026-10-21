import logoUrl from './brand/logo.svg';
import logoMarkUrl from './brand/logo-mark.svg';
import flagRuUrl from './flags/ru.webp';
import checkContainedUrl from './icons/check-contained.svg';
import clearUrl from './icons/clear.svg';
import eyeOffUrl from './icons/eye-off.svg';
import eyeOpenUrl from './icons/eye-open.svg';
import heroEnterCodeUrl from './heroes/enter-code.webp';
import heroLoginUrl from './heroes/login.webp';
import heroPasswordRecoveryUrl from './heroes/password-recovery.webp';
import heroReferralInvalidUrl from './heroes/referral-invalid.webp';
import heroReferralInvalidMobileUrl from './heroes/referral-invalid-mobile.webp';

/** Иконки UI (поля, правила пароля) */
export const authRrIcons = {
  clear: clearUrl,
  eyeOpen: eyeOpenUrl,
  eyeOff: eyeOffUrl,
  checkContained: checkContainedUrl,
} as const;

/** Бренд */
export const authRrBrand = {
  logo: logoUrl,
  /** Знак RSM без wordmark — свёрнутый сайдбар */
  logoMark: logoMarkUrl,
} as const;

/**
 * Дефолтные ссылки на юридические документы (PDF в public/ origin приложения).
 * Для SSO/rusaiauth передайте свои пути через props (`policy-href` и т.д.).
 */
export const authRrLegalLinks = {
  userAgreement: '/user-agreement.pdf',
  personalDataConsent: '/SOPD-Fintech.pdf',
  personalDataPolicy: '/Policy.pdf',
  support: 'https://t.me/uliasupport',
} as const;

/** Флаги / индикаторы страны */
export const authRrFlags = {
  ru: flagRuUrl,
} as const;

export type AuthRrHeroVariant =
  | 'login'
  | 'password-recovery'
  | 'enter-code'
  | 'referral-invalid';

export type AuthRrHeroImageMeta = {
  src: string;
  width: number;
  height: number;
};

export type AuthRrHeroMeta = AuthRrHeroImageMeta & {
  /** Отдельная иллюстрация на узких экранах (≤960px) */
  mobile?: AuthRrHeroImageMeta;
};

/** Иллюстрации справа (desktop), пропорции 2085×2739 */
export const authRrHeroByVariant: Record<AuthRrHeroVariant, AuthRrHeroMeta> = {
  login: {
    src: heroLoginUrl,
    width: 2085,
    height: 2739,
  },
  'password-recovery': {
    src: heroPasswordRecoveryUrl,
    width: 2085,
    height: 2739,
  },
  'enter-code': {
    src: heroEnterCodeUrl,
    width: 2085,
    height: 2739,
  },
  'referral-invalid': {
    src: heroReferralInvalidUrl,
    width: 3483,
    height: 1335,
    mobile: {
      src: heroReferralInvalidMobileUrl,
      width: 984,
      height: 1200,
    },
  },
};

export function getAuthRrHero(variant: AuthRrHeroVariant = 'login'): AuthRrHeroMeta {
  return authRrHeroByVariant[variant];
}

/** @deprecated используйте authRrBrand / authRrIcons / authRrFlags / getAuthRrHero */
export const authRrAssets = {
  logo: authRrBrand.logo,
  hero: authRrHeroByVariant.login.src,
  heroLogin: authRrHeroByVariant.login.src,
  heroPasswordRecovery: authRrHeroByVariant['password-recovery'].src,
  heroEnterCode: authRrHeroByVariant['enter-code'].src,
  flagRu: authRrFlags.ru,
  eyeOpen: authRrIcons.eyeOpen,
  eyeOff: authRrIcons.eyeOff,
  clear: authRrIcons.clear,
  checkContained: authRrIcons.checkContained,
} as const;

/** @deprecated используйте getAuthRrHero */
export const authRrHeroDimensions = authRrHeroByVariant.login;

export type AuthRrAssetKey = keyof typeof authRrAssets;
export type AuthRrIconKey = keyof typeof authRrIcons;
