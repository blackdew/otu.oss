import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { createClient } from '@/supabase/utils/server';

export async function GET(request: Request) {
    try {
        // Supabase 클라이언트 생성
        const supabase = await createClient();

        // 사용자 확인 (서버사이드에서는 getUser()로 JWT를 검증)
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
        }

        // 페이지 소유권 확인
        const { data: page, error: pageError } = await supabase
            .from('page')
            .select('user_id')
            .eq('id', id)
            .single();

        if (pageError || !page) {
            return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        // 페이지 소유자 확인
        if (page.user_id !== user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 캐시 무효화 실행
        await revalidateTag(`share-page-${id}`, 'max');
        return NextResponse.json({
            message: 'Revalidated',
            id: `share-page-${id}`,
        });
    } catch (error) {
        console.error('Revalidate error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
