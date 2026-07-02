/**
 * Централізоване перетворення помилок Firebase/Firestore на ЗРОЗУМІЛІ,
 * дієві повідомлення для користувача.
 *
 * Принцип (за вимогою): користувач має бачити не "щось пішло не так", а чітко —
 * ЯКИЙ захист спрацював і ЩО робити. Приховувати наявність захисту від шахрая
 * сенсу немає — у пріоритеті зручність живих користувачів.
 *
 * Важливо: Firestore на всі відмови правил повертає `permission-denied` і не
 * розрізняє, який саме clause не пройшов. Тому точні повідомлення про розмір,
 * порожні поля та занадто часті збереження ми формуємо ДО запиту (клієнтська
 * пре-валідація, кидаючи AppError), а мапінг нижче обробляє серверні коди.
 */
import { get } from 'svelte/store';
import { t } from 'svelte-i18n';

interface FirebaseLikeError {
  code?: string;
  message?: string;
  name?: string;
}

/** Наша власна, вже локалізована помилка. Проходить крізь мапінг без змін. */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';
  }
}

/** Створити локалізовану AppError за ключем i18n. */
export function friendlyError(
  key: string,
  values?: Record<string, string | number | boolean | Date | null | undefined>
): AppError {
  const T = get(t);
  return new AppError(values ? T(key, { values }) : T(key));
}

/** Перетворити будь-яку помилку на зрозуміле локалізоване повідомлення. */
export function toFriendlyMessage(error: unknown, fallbackKey = 'error.actionFailed'): string {
  const T = get(t);

  // Наші власні (вже дружні) повідомлення — не чіпаємо.
  if (error instanceof AppError) return error.message;

  const e = (error ?? {}) as FirebaseLikeError;
  const code = (e.code ?? '').toLowerCase();
  const msg = (e.message ?? '').toLowerCase();

  // App Check / reCAPTCHA / атестація застосунку
  if (
    code.includes('app-check') || code.includes('appcheck') ||
    msg.includes('app check') || msg.includes('appcheck') ||
    msg.includes('attestation') || msg.includes('recaptcha')
  ) {
    return T('error.appCheck');
  }

  switch (code) {
    case 'resource-exhausted':      // вичерпано квоту / спрацював ліміт
      return T('error.rateLimited');
    case 'permission-denied':       // правила відхилили (права або App Check)
      return T('error.permissionDenied');
    case 'unauthenticated':
      return T('error.unauthenticated');
    case 'unavailable':
    case 'deadline-exceeded':
    case 'cancelled':
    case 'aborted':
      return T('error.network');
    case 'already-exists':
      return T('error.alreadyExists');
    case 'invalid-argument':
    case 'failed-precondition':
    case 'out-of-range':
      return T('error.invalidData');
    case 'not-found':
      return T('error.notFound');
  }

  return T(fallbackKey);
}

/** Обгортка: перекидає помилку вже з дружнім повідомленням у .message. */
export function rethrowFriendly(error: unknown): never {
  if (error instanceof AppError) throw error;
  throw new Error(toFriendlyMessage(error));
}

/**
 * Логувати з урахуванням типу: наші контрольовані AppError (cooldown, завеликий
 * текст тощо) — це очікувана поведінка, тому console.warn (без стек-трейсу як
 * error). Несподівані помилки — console.error.
 */
export function logError(error: unknown, context?: string): void {
  if (error instanceof AppError) {
    console.warn(context ? `[${context}] ${error.message}` : error.message);
  } else if (context) {
    console.error(`[${context}]`, error);
  } else {
    console.error(error);
  }
}
