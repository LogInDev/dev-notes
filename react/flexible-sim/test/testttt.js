closeAIThread(threadid, type, callback) {
  const store = Store.getStore();
  const state = store.getState().aiThread;

  const panelThreadId = state.currentChannel;
  const openedPopupThreads = state.currentPopupThread || [];

  const isPanelOpened = panelThreadId === threadid;
  const isPopupOpened = openedPopupThreads.indexOf(threadid) !== -1;

  // 1) 패널에서 새로운 스레드를 열려고 할 때,
  //    기존 패널에 다른 스레드가 열려 있으면 먼저 닫는다.
  if (type === 'panel' && panelThreadId && panelThreadId !== threadid) {
    this.apihandler.closeAIThread(panelThreadId);
    store.dispatch(actions.closeAIThread(panelThreadId));
  }

  // 2) 지금 닫으려고 하는 threadid가 실제로 패널/팝업 어디에 열려 있는지 기준으로 닫기
  if (isPanelOpened || isPopupOpened) {
    // API 호출은 한 번만
    this.apihandler.closeAIThread(threadid);

    if (isPanelOpened) {
      // 패널에 열려 있던 경우
      store.dispatch(actions.closeAIThread(threadid));
    }

    if (isPopupOpened) {
      // 팝업에 열려 있던 경우
      store.dispatch(actions.closeAIThreadPopup(threadid));
    }
  }

  if (typeof callback === 'function') callback();
}