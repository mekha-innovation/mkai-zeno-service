import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { TasksService } from 'src/tasks/tasks.service';

@Injectable()
export class SqsWorkerService {
  private readonly sqsClient: SQSClient;
  private readonly logger = new Logger(SqsWorkerService.name);
  private queueHandlers: {
    [queueUrl: string]: (message: Message) => Promise<void>;
  };

  constructor(
    private configService: ConfigService,
    private tasksService: TasksService,
  ) {
    this.sqsClient = new SQSClient({
      region: this.configService.get('APP_AWS_REGION') as string,
      credentials: {
        accessKeyId: this.configService.get('APP_AWS_ACCESS_KEY_ID') as string,
        secretAccessKey: this.configService.get(
          'APP_AWS_SECRET_ACCESS_KEY',
        ) as string,
      },
    });

    const EXCAMPLE_QUEUE_URL =
      this.configService.get<string>('EXCAMPLE_QUEUE_URL') || '';

    // ตั้ง mapping queue → handler
    this.queueHandlers = {
      [EXCAMPLE_QUEUE_URL]: (message: Message): Promise<void> =>
        this.tasksService.taskTest(message),
    };
  }

  async onModuleInit() {
    for (const [queueUrl, handler] of Object.entries(this.queueHandlers)) {
      await this.spawnWorker(queueUrl, handler);
    }
  }

  async spawnWorker(
    queueUrl: string,
    handler: (message: Message) => Promise<void>,
  ) {
    this.logger.log(`Worker started for queue: ${queueUrl}`);

    while (true) {
      try {
        const command = new ReceiveMessageCommand({
          QueueUrl: queueUrl,
          MaxNumberOfMessages: 1,
          WaitTimeSeconds: 5,
        });

        const { Messages } = await this.sqsClient.send(command);

        if (!Messages || Messages.length === 0) {
          await this.sleep(1000);
          continue;
        }

        for (const message of Messages) {
          try {
            await handler(message);

            await this.sqsClient.send(
              new DeleteMessageCommand({
                QueueUrl: queueUrl,
                ReceiptHandle: message.ReceiptHandle!,
              }),
            );

            this.logger.log(`Message processed & deleted from ${queueUrl}`);
          } catch (error) {
            this.logger.error(
              `Error processing message from ${queueUrl}: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            );
          }
        }
      } catch (error) {
        this.logger.error(
          `Error polling ${queueUrl}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
        await this.sleep(5000);
      }
    }
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
