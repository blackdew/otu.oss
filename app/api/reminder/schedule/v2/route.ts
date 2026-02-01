import { alarmLogger } from '@/debug/alarm';
import errorResponse, { successResponse } from '@/functions/api/response';
import { createSuperClient } from '@/supabase/utils/super';
import { ulid } from 'ulid';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface SchedulerConfig {
    requestId: string;
}

class ReminderScheduler {
    private supabase;
    private config: SchedulerConfig;

    constructor(config: SchedulerConfig) {
        this.config = config;
        this.supabase = createSuperClient();
    }

    async schedule(): Promise<void> {
        try {
            // 1. 다음 정각 시간 계산
            const { nextHourTimeString, nextHourISO } = this.calculateNextHour();
            alarmLogger(this.config.requestId, '다음 정각 시간 계산 완료', {
                nextHourTimeString,
                nextHourISO,
            });

            // 2. 스케줄러 실행 로그
            alarmLogger(this.config.requestId, '스케줄러 실행 중...', {
                timestamp: new Date().toISOString(),
                nextHour: nextHourISO,
            });
        } catch (error) {
            alarmLogger(this.config.requestId, '스케줄러 에러 발생', { error });
            throw error;
        }
    }

    private calculateNextHour(): { nextHourTimeString: string; nextHourISO: string } {
        const now = new Date();
        now.setMinutes(0, 0, 0);
        now.setHours(now.getHours() + 1);

        const isoString = now.toISOString();
        return {
            nextHourTimeString: isoString.split('T')[1].slice(0, 8) + '+00',
            nextHourISO: isoString,
        };
    }
}

export async function GET(request: Request) {
    const requestId = ulid().slice(-4);
    alarmLogger(requestId, '---------------------------------------------- 시작.');

    // Production 환경에서는 실행 건너뛰기
    if (process.env.VERCEL_ENV === 'production') {
        alarmLogger(requestId, 'Production 환경에서는 스케줄러 실행을 건너뜁니다.');
        return successResponse({
            status: 200,
            message: 'Scheduler execution skipped in production environment',
            meta: { requestId, skipped: true },
        });
    }

    const config: SchedulerConfig = {
        requestId,
    };

    try {
        // 스케줄러 실행
        const scheduler = new ReminderScheduler(config);
        await scheduler.schedule();

        return successResponse({
            status: 200,
            message: 'Scheduler executed successfully',
            meta: { requestId },
        });
    } catch (error) {
        console.error('Scheduler error:', error);
        alarmLogger(requestId, '스케줄러 에러 발생', { error });

        return errorResponse(
            {
                status: 500,
                errorCode: 'SCHEDULER_FAILED',
                message: 'Failed to execute scheduler',
                data: {},
                meta: {},
            },
            error
        );
    }
}
