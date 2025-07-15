import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SqsWorkerModule } from './sqs-worker/sqs-worker.module';
import { ConfigModule } from '@nestjs/config';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // ทำให้ใช้ได้ทุก module โดยไม่ต้อง import ซ้ำ
    }),
    SqsWorkerModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
