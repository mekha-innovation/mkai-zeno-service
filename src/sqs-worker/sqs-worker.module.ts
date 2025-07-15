import { Module } from '@nestjs/common';
import { SqsWorkerService } from './sqs-worker.service';
import { TasksModule } from 'src/tasks/tasks.module';

@Module({
  imports: [TasksModule],
  providers: [SqsWorkerService],
  exports: [SqsWorkerService],
})
export class SqsWorkerModule {}
