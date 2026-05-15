import { Module } from '@nestjs/common';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { PaymentModule } from '../payment/payment.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    QueueModule,
    PaymentModule,
  ],
  controllers: [BookController],
  providers: [BookService],
  exports: [BookService],
})
export class BookModule {}
