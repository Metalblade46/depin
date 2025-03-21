import { Queue } from 'bullmq'
import type { LockingTask, ProcessingTask, UnlockingTask } from 'common/types';

class WithdrawalQueue {
    protected queue: Queue;
    protected queueType: 'locking' | 'processing' | 'unlocking';
    constructor(queueType: 'locking' | 'processing' | 'unlocking', attempts: number = 5, delay: number = 1000) {
        this.queueType = queueType
        this.queue = new Queue(this.queueType, {
            connection: {
                host: process.env.REDIS_HOST,
                port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
            },
            defaultJobOptions: {
                attempts,
                delay:delay,
                backoff: {
                    type: 'exponential',
                    delay:1000, // start delay of 1 second
                },
                removeOnComplete: {
                    age: 3600, // keep up to 1 hour
                    count: 1000, // keep up to 1000 jobs
                },
                removeOnFail: {
                    age: 24 * 3600, // keep up to 24 hours
                },
            }
        })

    }
}
export class LockingQueue extends WithdrawalQueue {
    constructor() {
        super('locking');
    }
    async addLockingTask(task: LockingTask) {
        const response = await this.queue.add(`locking-${task.validatorId}`, task);
        return `Locking task added for validator- ${task.validatorId} with task id ${response.id}`;
    }
}
export class ProcessingQueue extends WithdrawalQueue {
    constructor() {
        super('processing',5);
    }
    async addProcessingTask(task: ProcessingTask) {

        const response = await this.queue.add(`processing-${task.validatorId}`, task);
        return `Processing task added for validator- ${task.validatorId} with task id ${response.id}`;

    }
}
export class UnlockingQueue extends WithdrawalQueue {
    constructor() {
        super('unlocking',1,10000); //30 seconds delay for retries
    }
    async addUnlockingTask(task: UnlockingTask) {
        const response = await this.queue.add(`unlocking-${task.validatorId}`, task);
        return `Unlocking task added for validator- ${task.validatorId} with task id ${response.id}`;
    }
}