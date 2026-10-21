/**
 * Общие SVG-иконки (FSD: `shared/assets/icons`).
 * Импорт URL: `import { icons } from 'bibli/shared/assets/icons'`
 * Сырой SVG (currentColor): `import phone from 'bibli/shared/assets/icons/phone.svg?raw'`
 */
import arrowDownUrl from './arrow-down.svg'
import chatUrl from './chat.svg'
import chevronDownUrl from './chevron-down.svg'
import crossUrl from './cross.svg'
import mailUrl from './mail.svg'
import maxUrl from './max.svg'
import maxSmUrl from './max-sm.svg'
import moneyUrl from './money.svg'
import moreUrl from './more.svg'
import navContactsUrl from './nav-contacts.svg'
import navExperienceUrl from './nav-experience.svg'
import navGeneralUrl from './nav-general.svg'
import navSourceUrl from './nav-source.svg'
import pencilUrl from './pencil.svg'
import personUrl from './person.svg'
import phoneUrl from './phone.svg'
import phoneSmUrl from './phone-sm.svg'
import phoneWaveUrl from './phone-wave.svg'
import pinUrl from './pin.svg'
import plusUrl from './plus.svg'
import telegramUrl from './telegram.svg'
import telegramSmUrl from './telegram-sm.svg'
import trashUrl from './trash.svg'

export const icons = {
  arrowDown: arrowDownUrl,
  chat: chatUrl,
  chevronDown: chevronDownUrl,
  cross: crossUrl,
  mail: mailUrl,
  max: maxUrl,
  maxSm: maxSmUrl,
  money: moneyUrl,
  more: moreUrl,
  navContacts: navContactsUrl,
  navExperience: navExperienceUrl,
  navGeneral: navGeneralUrl,
  navSource: navSourceUrl,
  pencil: pencilUrl,
  person: personUrl,
  phone: phoneUrl,
  phoneSm: phoneSmUrl,
  phoneWave: phoneWaveUrl,
  pin: pinUrl,
  plus: plusUrl,
  telegram: telegramUrl,
  telegramSm: telegramSmUrl,
  trash: trashUrl,
} as const

export type IconName = keyof typeof icons
