  closeAIThread(threadid, type, callback){
    let store = Store.getStore();

    let panelThreadId = store.getState().aiThread.currentChannel;
    let openedPopupThreads = store.getState().aiThread.currentPopupThread;

    let openThread = threadid === panelThreadId ||
        openedPopupThreads.find(thread => thread === threadid);

    if(threadid !== panelThreadId && type === 'panel'){
      this.apihandler.closeAIThread(panelThreadId);
      store.dispatch(actions.closeAIThread(panelThreadId))
    }

    if(openThread) {
      this.apihandler.closeAIThread(threadid);
      type === 'panel' ? 
        store.dispatch(actions.closeAIThread(threadid)) :
        store.dispatch(actions.closeAIThreadPopup(threadid)); 
    }
    
    if(typeof callback === 'function') callback();
  }
