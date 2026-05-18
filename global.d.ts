import type messages from './messages/ru.json';

declare global {
  interface IntlMessages extends Omit<typeof messages, never> {}
}
