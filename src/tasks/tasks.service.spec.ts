import { Test } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { TaskRepository } from './task.repository';
import { FilterTaskDto } from './dto/filter-task.dto';
import { TaskStatus } from './task-status.enum';
import { NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';

const mockUser = {
  id: 1,
  username: 'Test User',
};

const mockTaskRepository = () => ({
  getTasks: jest.fn(),
  findOne: jest.fn(),
  createTask: jest.fn(),
  delete: jest.fn(),
});

describe('TasksService:', () => {
  let tasksService;
  let taskRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TaskRepository, useFactory: mockTaskRepository },
      ],
    }).compile();

    tasksService = await module.get<TasksService>(TasksService);
    taskRepository = await module.get<TaskRepository>(TaskRepository);
  });

  describe('getTasks:', () => {
    it('should get all tasks', async () => {
      taskRepository.getTasks.mockResolvedValue('clean house');
      expect(taskRepository.getTasks).not.toHaveBeenCalled();

      const filters: FilterTaskDto = {
        status: TaskStatus.IN_PROGRESS,
        search: 'some search',
      };

      const results = await tasksService.getTasks(filters, mockUser);

      expect(taskRepository.getTasks).toBeCalledTimes(1);
      expect(results).toBe('clean house');
      taskRepository.getTasks.mockClear();
    });
  });

  describe('getTaskById:', () => {
    it('should call taskRepository.findOne() and retreive task', async () => {
      const mockTask = { title: 'clean toilet', description: 'scrub it clean' };
      taskRepository.findOne.mockResolvedValue(mockTask);

      expect(taskRepository.findOne).not.toHaveBeenCalled();
      const result = await tasksService.getTaskById(1, mockUser);

      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 1,
          userId: mockUser.id,
        },
      });
      expect(result).toBe(mockTask);
    });

    it('should throw an error is a task is not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);
      expect(tasksService.getTaskById(1, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createTask:', () => {
    it('should call taskRepository.createTask successfully and return a task', async () => {
      const mockCreateTaskDto: CreateTaskDto = {
        title: 'Clean bedroom',
        description: 'Do it by Friday',
      };
      taskRepository.createTask.mockResolvedValue({
        ...mockCreateTaskDto,
        status: TaskStatus.OPEN,
      });

      expect(taskRepository.createTask).not.toHaveBeenCalled();
      const task = await tasksService.createTask(mockCreateTaskDto, mockUser);
      expect(taskRepository.createTask).toHaveBeenCalledWith(
        mockCreateTaskDto,
        mockUser,
      );
      expect(task).toStrictEqual({
        ...mockCreateTaskDto,
        status: TaskStatus.OPEN,
      });
    });
  });

  describe('deleteTask:', () => {
    it('should call tasksService.deleteTask() to delete a task', async () => {
      taskRepository.delete.mockResolvedValue({ affected: 1 });
      const mockTask = {
        id: 1,
        title: 'Clean kitchen',
        description: 'Including refridgerator',
      };

      expect(taskRepository.delete).not.toHaveBeenCalled();
      const task = await tasksService.deleteTaskById(mockTask.id, mockUser);
      expect(taskRepository.delete).toHaveBeenCalledWith({
        id: mockTask.id,
        userId: mockUser.id,
      });
      expect(task).toBeUndefined();
    });

    it('should throw an error if a task is not found', () => {
      taskRepository.delete.mockResolvedValue({ affected: 0 });
      const mockTask = {
        id: 1,
        title: 'Clean kitchen',
        description: 'Including refridgerator',
      };
      expect(taskRepository.delete).not.toHaveBeenCalled();
      expect(() =>
        tasksService.deleteTaskById(mockTask.id, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTaskStatus:', () => {
    it('should call tasksService.updateTaskStatus() and update the task status', async () => {
      const save = jest.fn().mockResolvedValue(true);
      tasksService.getTaskById = jest.fn().mockResolvedValue({
        status: TaskStatus.OPEN,
        save,
      });

      expect(tasksService.getTaskById).not.toHaveBeenCalled();
      expect(save).not.toHaveBeenCalled();
      const task = await tasksService.updateTaskStatus(
        1,
        TaskStatus.DONE,
        mockUser,
      );

      expect(tasksService.getTaskById).toHaveBeenCalled();
      expect(save).toHaveBeenCalled();
      expect(task.status).toEqual(TaskStatus.DONE);
    });
  });
});
