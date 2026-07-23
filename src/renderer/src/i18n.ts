import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import hu from './locales/hu.json'
import de from './locales/de.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import pt from './locales/pt.json'
import ru from './locales/ru.json'
import zh from './locales/zh.json'
import it from './locales/it.json'
import pl from './locales/pl.json'
import tr from './locales/tr.json'
import ja from './locales/ja.json'
import ko from './locales/ko.json'
import nl from './locales/nl.json'

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hu', label: 'Magyar' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' },
  { code: 'it', label: 'Italiano' },
  { code: 'pl', label: 'Polski' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'nl', label: 'Nederlands' }
] as const

const STORAGE_KEY = 'modpack-builder-language'

function getInitialLanguage(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) return stored
  return 'en'
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hu: { translation: hu },
    de: { translation: de },
    es: { translation: es },
    fr: { translation: fr },
    pt: { translation: pt },
    ru: { translation: ru },
    zh: { translation: zh },
    it: { translation: it },
    pl: { translation: pl },
    tr: { translation: tr },
    ja: { translation: ja },
    ko: { translation: ko },
    nl: { translation: nl }
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng)
})

export default i18n
