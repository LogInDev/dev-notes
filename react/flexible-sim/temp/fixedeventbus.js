registerOn(threadId){
  const _this = this;
  const store = Store.getStore();

  // 1) (tId, msg)로 맞추고, 즉시 호출
  const off = _this.apihandler.on(threadId, (tId, msg) => {
    _this.callbackAIThreadMessage(tId, msg);
  });

  // (선택) 아직 실제 register가 안 되어 있을 가능성 방지
  // 이미 register 되어 있으면 내부에서 무시하도록 구현해둔 상태라면 안전
  _this.apihandler.openAIThread(threadId);

  _this.apihandler.unreadAIThreadMessageCount((msg) => {
    store.dispatch(actions.unreadAIThreadMessageCount(msg));
  });

  store.dispatch(actions.initUnread(threadId));
  return off; // 반드시 (type) 인자 받는 함수여야 함
}


openAIThread(threadId) {
  const _this = this;

  let entry = _this.threadRegisterMap.get(threadId);
  if(entry && entry.reg) return;

  const header = { client: 0, UUID: global.Common.getCookie('sessionkey') };
  const addr = 'hynix.client.' + threadId;

  const handler = (msg) => {
    const e = _this.threadRegisterMap.get(threadId);
    if(!e) return;
    e.subscribers.forEach(fn => {
      try {
        fn(threadId, msg); // (threadId, msg)로 호출 — 리스너도 동일 시그니처
      } catch(err) {
        console.error('[Error] openAIThread handler:', err);
      }
    });
  };

  _this.sock.register(addr, header, handler);

  if (!entry) entry = { addr, handler, subscribers: new Set(), refs: 0, reg: true };
  else Object.assign(entry, { addr, handler, reg: true });

  _this.threadRegisterMap.set(threadId, entry);
}

on(threadId, listener){
  const _this = this;

  let entry = _this.threadRegisterMap.get(threadId);
  if(!entry) {
    entry = { addr: `hynix.client.${threadId}`, subscribers: new Set(), refs: 0, reg: false };
    _this.threadRegisterMap.set(threadId, entry);
  }
  entry.subscribers.add(listener);
  entry.refs += 1;

  // (type) 인자를 받아서 off로 전달
  return (type) => _this.off(threadId, type, listener);
}

off(threadId, type, listener){
  const _this = this;
  _this.store = Store.getStore();

  const entry = _this.threadRegisterMap.get(threadId);
  if(!entry) return;

  if(listener) entry.subscribers.delete(listener);
  entry.refs -= 1;

  if(entry.refs <= 0){
    if(entry.reg){
      try{
        if(type === 'panel'){
          if(!_this.store.getState().aiThread.currentPopupThread.find(popupId=>popupId===threadId)){
            _this.closeAIThread(threadId);
            _this.threadRegisterMap.delete(threadId);
          }
        } else if(type === 'popup'){
          if(_this.store.getState().aiThread.currentChannel !== threadId){
            _this.closeAIThread(threadId);
            _this.threadRegisterMap.delete(threadId);
          }
        } else {
          // type이 없으면 안전하게 바로 닫거나, 정책에 맞게 처리
          _this.closeAIThread(threadId);
          _this.threadRegisterMap.delete(threadId);
        }
      } catch(error){
        console.error('[Error] closeAIThread - unregister:', error)
      }
    }
  }
}

// 패널
componentDidMount() {
  this.off = Socket.getApi().registerOn(this.props.currentId);
}
componentWillUnmount() {
  this.off && this.off('panel'); // ← type 넘겨주기
}

// 팝업
componentDidMount() {
  this.off = Socket.getApi().registerOn(this.props.currentId);
  window.addEventListener('unload', this.handleUnload);
}
componentWillUnmount() {
  this.cleanup();
}
handleUnload = () => this.cleanup();
cleanup() {
  this.off && this.off('popup');    // ← type 넘겨주기
  window.removeEventListener('unload', this.handleUnload);
}

registerOn(threadId){
  const store = Store.getStore();

  // ❶ 소켓 핸들러 보장
  this.apihandler.openAIThread(threadId);

  // ❷ (tId, msg)로 맞추고 즉시 호출
  const off = this.apihandler.on(threadId, (tId, msg) => {
    this.callbackAIThreadMessage(tId, msg);
  });

  // ... 기타 로직
  return off; // (type) 받을 수 있게 on()에서 반환함수 바꿔둬야 함
}

on(threadId, listener){
  let entry = this.threadRegisterMap.get(threadId);
  if(!entry){
    entry = { addr: `hynix.client.${threadId}`, subscribers:new Set(), refs:0, reg:false };
    this.threadRegisterMap.set(threadId, entry);
  }
  entry.subscribers.add(listener);
  entry.refs += 1;
  return (type) => this.off(threadId, type, listener); // ❸ type 전달
}

openAIThread(threadId){
  let entry = this.threadRegisterMap.get(threadId);
  if(entry && entry.reg) return;

  const addr = `hynix.client.${threadId}`;
  const handler = (msg) => {
    const e = this.threadRegisterMap.get(threadId);
    if(!e) return;
    e.subscribers.forEach(fn => {
      try { fn(threadId, msg); } catch(e){ console.error(e); }
    });
  };

  this.sock.register(addr, { client:0, UUID: global.Common.getCookie('sessionkey') }, handler);

  if(!entry) entry = { addr, handler, subscribers:new Set(), refs:0, reg:true };
  else Object.assign(entry, { addr, handler, reg:true });
  this.threadRegisterMap.set(threadId, entry);
}

callbackAIThreadMessage(threadid, msg){
  this.handleMessage(threadid, msg);
}


