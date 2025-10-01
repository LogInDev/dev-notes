// src/socket/EventBusHub.js
import * as Sock from '../socket';

class EventBusHub {
  constructor() {
    this.eb = null;
    // threadId -> { address, handler, handlerId, subscribers:Set<fn>, refs:number, reg:boolean }
    this.map = new Map();
  }
  ensureEB() {
    if (!this.eb) this.eb = Sock.getApi();
    return this.eb;
  }

  // 1) "레지스터 등록" (소켓 레벨) : 실제 registerHandler는 threadId 당 1번만
  register(threadId) {
    const eb = this.ensureEB();
    let entry = this.map.get(threadId);
    if (entry?.reg) return; // 이미 등록됨

    const address = `/ai/threads/${threadId}`;
    const handler = (msg) => {
      const payload = msg?.body ?? msg;
      const e = this.map.get(threadId);
      if (!e) return;
      e.subscribers.forEach(fn => { try { fn(payload); } catch (err) { console.error(err); }});
    };
    const handlerId = eb.registerHandler(address, handler);

    if (!entry) entry = { address, handler, handlerId, subscribers: new Set(), refs: 0, reg: true };
    else Object.assign(entry, { address, handler, handlerId, reg: true });

    this.map.set(threadId, entry);
  }

  // 2) "콜백 적용" (UI 레벨) : 화면별 listener 추가
  on(threadId, listener) {
    let entry = this.map.get(threadId);
    if (!entry) {
      entry = { address: `/ai/threads/${threadId}`, subscribers: new Set(), refs: 0, reg: false };
      this.map.set(threadId, entry);
    }
    entry.subscribers.add(listener);
    entry.refs += 1;

    // off 함수 반환
    return () => this.off(threadId, listener);
  }

  // 콜백/참조 해제
  off(threadId, listener) {
    const entry = this.map.get(threadId);
    if (!entry) return;
    if (listener) entry.subscribers.delete(listener);
    entry.refs -= 1;
    if (entry.refs <= 0) {
      // 아무 화면도 안 쓰면 실제 unregister
      if (entry.reg) {
        try { this.eb.unregisterHandler(entry.address, entry.handlerId); }
        catch(e) { console.error(e); }
      }
      this.map.delete(threadId);
    }
  }
}

export default new EventBusHub();

// AIPanel.js (클래스형)
componentDidMount() {
  const { threadId } = this.props;
  // 1) 레지스터 등록(소켓에 실제 핸들러 1개 보장)
  EventBusHub.register(threadId);
  // 2) 콜백 적용(이 화면 전용 listener 등록)
  this.off = EventBusHub.on(threadId, (message) => {
    // 화면/Redux 반영
    this.props.aiThreadMessageReceived(threadId, message);
    // 패널 전용 UI 효과(예: 스크롤)
  });
}
componentWillUnmount() {
  this.off && this.off(); // 콜백 해제(refs 감소 → 필요시 unregister)
}


// AIPopup.js
componentDidMount() {
  const { threadId } = this.props;
  EventBusHub.register(threadId); // 이미 등록돼 있으면 내부에서 무시
  this.off = EventBusHub.on(threadId, (message) => {
    this.props.aiThreadMessageReceived(threadId, message);
    // 팝업 전용 UI 효과
  });
  window.addEventListener('unload', this.handleUnload);
}
componentWillUnmount() { this.cleanup(); }
handleUnload = () => this.cleanup();
cleanup() {
  this.off && this.off(); // 콜백 해제
  window.removeEventListener('unload', this.handleUnload);
}


