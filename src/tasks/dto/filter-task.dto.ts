import { TaskStatus } from '../task-status.enum';
import { IsOptional, IsNotEmpty, IsIn } from 'class-validator';

export class FilterTaskDto {
  @IsOptional()
  @IsNotEmpty()
  search: string;

  @IsOptional()
  @IsIn([TaskStatus.OPEN, TaskStatus.IN_PROGRESS, TaskStatus.DONE])
  status: TaskStatus;
}
