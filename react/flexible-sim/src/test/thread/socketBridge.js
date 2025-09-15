// 서버 푸시를 수신하는 threadId 단위 리스너 등록
import * as Store from 'GlobalStore'; // 프로젝트에서 쓰는 전역 스토어 getter
import { aiAppendMessage, aiSetLoading } from '../store/actions';

const _registered = new Set();

// 서버 주소 규칙 (★프로젝트 규약에 맞게 수정)
export const AI_THREAD_ADDR = (threadId) => `ai.thread.${threadId}`;

export function ensureThreadListener(eventbus, threadId) {
    if (!threadId || _registered.has(threadId)) return;

    const addr = AI_THREAD_ADDR(threadId);

    const handler = (err, msg) => {
        if (err) {
            console.error(`[${addr}]`, err);
            return;
        }
        const body = (msg && msg.body) || {};
        // body 예시: { messageId, role: 'assistant', content, partial, done, ts }

        Store.getStore().dispatch(
            aiAppendMessage(threadId, {
                messageId: body.messageId || `s_${Date.now()}`,
                role: body.role || 'assistant',
                content: body.content || '',
                partial: !!body.partial,
                ts: body.ts || Date.now()
            })
        );

        if (body.done) {
            Store.getStore().dispatch(aiSetLoading(threadId, false));
        }
    };

    // Vert.x EventBus 구독
    eventbus.registerHandler(addr, handler);

    _registered.add(threadId);
}



// 기존 ApiHandler에 메서드만 "추가"하는 파일 (형식 유지만 맞추면 됨)
export const AI_REQUEST_ADDR = 'ai.request'; // ★ 서버 계약에 맞게 변경

export default function extendApiHandler(ApiHandlerClass) {
    // 이미 생성된 인스턴스의 prototype에 메서드 추가
    if (!ApiHandlerClass.prototype.aiSend) {
        ApiHandlerClass.prototype.aiSend = function ({ text }, cb) {
            // this.eb = this.sock.eventbus;  (기존 코드 스타일에 맞춰 존재한다고 가정)
            try {
                this.eb.send(AI_REQUEST_ADDR, { text }, (reply) => {
                    // reply.body.threadId 를 즉시 돌려준다는 계약
                    cb && cb(reply);
                });
            } catch (e) {
                console.error('[ApiHandler.aiSend] error:', e);
                cb && cb(null, e);
            }
        };
    }
}
