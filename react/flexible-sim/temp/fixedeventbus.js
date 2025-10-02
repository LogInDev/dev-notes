openAIThread(threadId) {
  const _this = this;

  let entry = _this.threadRegisterMap.get(threadId);
  if (entry && entry.reg) return;

  const header = { client: 0, UUID: global.Common.getCookie('sessionkey') };
  const addr   = `hynix.client.${threadId}`;

  const handler = (msg) => {
    const e = _this.threadRegisterMap.get(threadId);
    if (!e) return;

    const payload = msg;
    // 타입별 리스너에 각각 1번씩만 호출
    const { panel, popup } = e.listeners || {};
    try {
      panel && panel(threadId, payload);
    } catch (err) { console.error('[panel listener error]', err); }
    try {
      popup && popup(threadId, payload);
    } catch (err) { console.error('[popup listener error]', err); }
  };

  _this.sock.register(addr, header, handler);

  if (!entry) {
    entry = { addr, handler, listeners: { panel: null, popup: null }, refs: 0, reg: true };
  } else {
    Object.assign(entry, { addr, handler, reg: true });
    // listeners 초기화 보장
    if (!entry.listeners) entry.listeners = { panel: null, popup: null };
  }
  _this.threadRegisterMap.set(threadId, entry);
}


// type: 'panel' | 'popup'
on(threadId, type, listener) {
  const _this = this;

  let entry = _this.threadRegisterMap.get(threadId);
  if (!entry) {
    entry = { addr: `hynix.client.${threadId}`, listeners: { panel: null, popup: null }, refs: 0, reg: false };
    _this.threadRegisterMap.set(threadId, entry);
  } else if (!entry.listeners) {
    entry.listeners = { panel: null, popup: null };
  }

  // 같은 type은 무조건 교체(중복 제거)
  if (entry.listeners[type]) {
    // 기존 리스너가 있었으면 ref를 줄여준다(선택)
    entry.refs = Math.max(0, entry.refs - 1);
  }
  entry.listeners[type] = listener;
  entry.refs += 1;

  // off 반환 — type을 반드시 받아서 정확히 지우게
  return () => _this.off(threadId, type);
}

off(threadId, type) {
  const _this = this;
  _this.store = Store.getStore();

  const entry = _this.threadRegisterMap.get(threadId);
  if (!entry || !entry.listeners) return;

  if (entry.listeners[type]) {
    entry.listeners[type] = null;
    entry.refs = Math.max(0, entry.refs - 1);
  }

  // 남은 사용 여부 판단
  const stillUsed = !!(entry.listeners.panel || entry.listeners.popup);

  if (!stillUsed) {
    if (entry.reg) {
      try {
        _this.closeAIThread(threadId);
      } catch (error) {
        console.error('[Error] closeAIThread - unregister:', error);
      }
    }
    _this.threadRegisterMap.delete(threadId);
  }
}


registerOn(threadId, type) {
  const _this  = this;
  const store  = Store.getStore();

  // 실제 레지스터 보장(이미 있으면 내부에서 무시)
  _this.apihandler.openAIThread(threadId);

  // (tId, msg) 형태로 맞추고, type을 명시하여 단일화
  const off = _this.apihandler.on(threadId, type, (tId, msg) => {
    _this.callbackAIThreadMessage(tId, msg);
  });

  _this.apihandler.unreadAIThreadMessageCount((msg) => {
    store.dispatch(actions.unreadAIThreadMessageCount(msg));
  });
  store.dispatch(actions.initUnread(threadId));

  return off; // 호출 시 인자 없이 off() — 위 구현에 맞춤
}

// 패널
componentDidMount() {
  this.off = Socket.getApi().registerOn(this.props.currentId, 'panel');
}
componentWillUnmount() {
  this.off && this.off();
}

// 팝업
componentDidMount() {
  this.off = Socket.getApi().registerOn(this.props.currentId, 'popup');
  window.addEventListener('unload', this.handleUnload);
}
componentWillUnmount() { this.cleanup(); }
handleUnload = () => this.cleanup();
cleanup() {
  this.off && this.off();
  window.removeEventListener('unload', this.handleUnload);
}





