import { useState, useEffect, useCallback, useRef } from 'react';
import { backupLogger } from '@/debug/backup';
import debounce from 'lodash/debounce';
import { useAtomValue } from 'jotai';
import { isModifiedState } from '@/lib/jotai';

const BACKUP_PREFIX = 'editor_backup_';

export interface EditorContent {
    title: string;
    body: string;
}

export function useEditorBackup(pageId: string | null, initialContent?: EditorContent | null) {
    const [currentContent, setCurrentContent] = useState<EditorContent | null>(null);
    const isModified = useAtomValue(isModifiedState);
    const lastBackupTimeRef = useRef<number>(0);
    const MIN_BACKUP_INTERVAL = 800; // 최소 백업 간격 (ms)

    // 백업 키 생성
    const getBackupKey = useCallback(() => {
        return `${BACKUP_PREFIX}${pageId || 'new'}`;
    }, [pageId]);

    // 백업 저장 (디바운스 적용)
    const saveBackup = useCallback(
        debounce((content: EditorContent) => {
            // 마지막 백업 이후 최소 간격을 확인
            const now = Date.now();
            if (now - lastBackupTimeRef.current < MIN_BACKUP_INTERVAL) {
                backupLogger('백업 간격이 너무 짧아 스킵');
                return;
            }

            // 빈 내용은 백업하지 않음
            if (!content.title.trim() && !content.body.trim()) {
                backupLogger('내용이 비어있어 백업하지 않음. 기존에 백업을 삭제 함.');
                removeBackup();
                return;
            }

            // 원본과 현재 내용의 실질적 차이가 있는지 확인
            if (initialContent) {
                const titleUnchanged =
                    normalizeText(initialContent.title) === normalizeText(content.title);
                const bodyUnchanged =
                    normalizeHtml(initialContent.body) === normalizeHtml(content.body);

                // 변경이 없으면 저장하지 않음
                if (titleUnchanged && bodyUnchanged) {
                    backupLogger('원본과 동일하여 백업 생성 안함');
                    return;
                }
            }

            try {
                const backup = {
                    ...content,
                    timestamp: now,
                };
                localStorage.setItem(getBackupKey(), JSON.stringify(backup));
                lastBackupTimeRef.current = now;
                backupLogger('저장 완료', content);
            } catch (error) {
                backupLogger('저장 실패:', error);
                console.error('Editor backup error:', error);
            }
        }, 1000), // 1초 디바운스로 변경 (오케스트레이션은 useEditorOperations에서 처리)
        [getBackupKey, initialContent]
    );

    // 백업 불러오기
    const loadBackup = useCallback((): (EditorContent & { timestamp: number }) | null => {
        try {
            const data = localStorage.getItem(getBackupKey());
            return data ? JSON.parse(data) : null;
        } catch (error) {
            backupLogger('불러오기 실패:', error);
            console.error('Editor backup error:', error);
            return null;
        }
    }, [getBackupKey]);

    // 백업 삭제
    const removeBackup = useCallback(() => {
        try {
            localStorage.removeItem(getBackupKey());
            backupLogger('삭제 완료');
        } catch (error) {
            backupLogger('삭제 실패:', error);
            console.error('Editor backup error:', error);
        }
    }, [getBackupKey]);

    // 백업 존재 여부 확인
    const hasBackup = useCallback(() => {
        return !!localStorage.getItem(getBackupKey());
    }, [getBackupKey]);

    // 백업 데이터 비교용 함수
    const getDiffText = useCallback((oldText: string, newText: string): string => {
        try {
            const diff = require('diff');
            const diffResult = diff.diffChars(oldText || '', newText || '');
            let diffText = '';

            diffResult.forEach((part: any) => {
                const value = part.value;
                if (part.added) {
                    diffText += `<추가된 내용: ${value.substr(0, 20)}${value.length > 20 ? '...' : ''}>`;
                } else if (part.removed) {
                    diffText += `<삭제된 내용: ${value.substr(0, 20)}${value.length > 20 ? '...' : ''}>`;
                }
            });

            return diffText;
        } catch (error) {
            backupLogger('차이 비교 실패:', error);
            return '(차이 분석 불가)';
        }
    }, []);

    // 콘텐츠 변경시 백업 처리
    useEffect(() => {
        if (!currentContent || !isModified) return;

        // 변경 내용이 있을 때만 백업
        saveBackup(currentContent);

        return () => {
            // 컴포넌트 언마운트 시 디바운스된 saveBackup 취소
            saveBackup.cancel();
        };
    }, [currentContent, isModified, saveBackup]);

    return {
        setCurrentContent,
        loadBackup,
        removeBackup,
        hasBackup,
        getDiffText,
    };
}

// 텍스트 정규화 헬퍼 함수
function normalizeText(text: string = ''): string {
    return text.trim().replace(/\s+/g, ' ');
}

// HTML 정규화 헬퍼 함수
function normalizeHtml(html: string = ''): string {
    if (!html) return '';

    // HTML 태그 제거 및 공백 정규화
    const plainText = html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return plainText;
}
