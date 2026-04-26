import { EventEnum } from 'src/enums/event.enum';

export interface SendVerificationEmailEvent {
  type: EventEnum;
  data: {
    email: string;
  };
  timestamp: Date;
}

export type EmailEvent = SendVerificationEmailEvent;
