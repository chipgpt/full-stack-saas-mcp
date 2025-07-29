import { once } from 'lodash';
import Mailgun from 'mailgun.js';
import { Resource } from 'sst';

const mailgun = new Mailgun(FormData);

export const getMailgunClient = once(() => {
  // @ts-ignore
  return mailgun.client({ username: 'api', key: Resource.MyMailgun.key });
});

export function sendMailgunEmail(email: string, subject: string, html: string, text: string) {
  // @ts-ignore
  return getMailgunClient().messages.create(Resource.MyMailgun.domain, {
    from: `ChipGPT <support@chipgpt.biz>`,
    to: [email],
    subject,
    html,
    text,
  });
}
