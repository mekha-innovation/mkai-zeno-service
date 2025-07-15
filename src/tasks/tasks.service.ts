import { Injectable } from '@nestjs/common';
import { Message } from '@aws-sdk/client-sqs';

@Injectable()
export class TasksService {
  async taskTest(message: Message) {}
}
