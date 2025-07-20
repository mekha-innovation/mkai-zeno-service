import { Injectable } from '@nestjs/common';
import { Message } from '@aws-sdk/client-sqs';

@Injectable()
export class TasksService {
  async taskTest(_message: Message) {
    // todo: implement task test
  }
}
