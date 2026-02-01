'use client';
import { useEffect } from 'react';
import s from './style.module.css';
import '@/app/globals.css';
import { useCalculateViewportHeight } from '@/hooks/useCalculateViewportHeight';
export default function ByePage() {
    useCalculateViewportHeight();
    //
    useEffect(() => {
        // body의 marin을 0으로 설정
        document.body.style.margin = '0';
    });
    return (
        <div className={`${s.root} fit-height`}>
            <div>
                죄송합니다, 기술적인 이유로 익명 사용자는 하나의 탭에서만 서비스를 이용할 수
                있습니다.
            </div>
        </div>
    );
}
