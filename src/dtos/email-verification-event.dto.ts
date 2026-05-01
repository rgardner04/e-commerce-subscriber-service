import { EventEnum } from 'src/enums/event.enum';
import { AuthStage } from 'src/enums/auth-stage.enum';

export interface SendVerificationEmailEvent {
  type: EventEnum;
  data: {
    email: string;
    authStage: AuthStage;
  };
  timestamp: Date;
}

export type EmailEvent = SendVerificationEmailEvent;
