ChannelView.s
ChannelView.js에서 openCreateAIThread()함수로 실행하는거랑 apihandler에서 다른 this를 가리키는 것 같아. 콘솔에 찍히는 결과가 달라. 그래서 결과적으로 내가 의도한대로 열린건 안열리게하는게 안돼. 한번열린건 또 열리면 안돼.

- openCreateAIThread()로 열었을 때 콘솔-
열린다***************** 700002994
apihandler.js:1669 열린다***************** Map(1) {'700002415' => true}
apihandler.js:1671 열린다***************** false

- THREAD2000으로 열었을 때 콘솔
열린다***************** 700002994
apihandler.js:1669 열린다***************** Map(0) {size: 0}
apihandler.js:1671 열린다***************** false


ChannelView.js
 openCreateAIThread() {
    Socket.getApi().createAIThread();
  }

callbackHandler.js
case 'THREAD2000': // AI THREAD 추가, 변경
store.dispatch(actions.addAIThread(msg.channel_info));
// store.dispatch(actions.createAIMessages(msg.channel_info.channel_id));
if (msg.channel_info.register === global.CONFIG.login.userid) {
let isMini = false;
if (global.externalParam) {
       let { type } = global.externalParam;
       if (type === 'Hytube') {
       isMini = true;
       } else if (type === 'Iboard') {
       isMini = true;
       } else if (type === 'HiFeedback') {
       isMini = true;
       } else if (type === 'tms') {
       isMini = true;
       }
}
if (!isMini) this.openAIThreadPanel(msg.channel_info.channel_id);

  openAIThreadPanel(threadid, findid, callback){
    let _this = this;
    let store = Store.getStore();
    
    let threadids = store.getState().aiThread.currentThreads;
    let panelThreadId = store.getState().aiThread.currentChannel;
    let openThread = (!!panelThreadId === threadid) || threadids.find(thread => thread === threadid)
    if (openThread) {
      _this.apihandler.closeAIThread(threadid);
      store.dispatch(actions.closeAIThread(threadid));
    }
    
    store.dispatch(actions.createAIMessages(threadid));
    store.dispatch(actions.openAIThread(threadid, 'panel'));

    _this.openAIThread(threadid, findid, 'panel', callback)
  }
  
  openAIThreadPopup(threadid, findid, callback){
    let _this = this;
    let store = Store.getStore();

    let threadids = store.getState().aiThread.currentThreads;
    let panelThreadId = store.getState().aiThread.currentChannel;
    let openThread = (!!panelThreadId === threadid) || threadids.find(thread => thread === threadid)
    if (openThread) {
      _this.apihandler.closeAIThread(threadid);
      store.dispatch(actions.closeAIThreadPopup(threadid));
    }      
    store.dispatch(actions.createAIMessages(threadid));
    store.dispatch(actions.openAIThread(threadid, 'popup'));

    _this.openAIThread(threadid, findid, 'popup', callback)
  }

  openAIThread(threadid, findid, type, callback) {
    let _this = this;
    let store = Store.getStore();

    _this.apihandler.getAIThreadInfoSummary(threadid, (msg) => {
      let threadMove = true;
      if (findid) {
        _this.selectAIMessageList('FIND', findid, threadMove, threadid);
      } else if (msg.unread_message_id !== '-1') {
        _this.selectAIMessageList('FIND', msg.unread_message_id, threadMove, threadid);
      } else {
        _this.apihandler.getAIThreadMessages(threadid, _this.onGetAIThreadMessages.bind(_this));
      }
      _this.onGetThreadInfoSummary(threadid, msg);
      if(typeof callback === 'function') callback();
      if(type === 'panel'){
        store.dispatch(actions.setAiThreadTab(true));
        store.dispatch(actions.clickDetailTabItem('assistant'));
      }
      _this.airunner.requestAIStatus(threadid,(msg)=>{
        if(msg.status === 'W'){
          store.dispatch(actions.setLoading(true, threadid));
        }else{
          store.dispatch(actions.setLoading(false, threadid));
        }
      })
      // writting 초기화 추가
      // store.dispatch(actions.deleteWriting(msg));
    });
    _this.apihandler.openAIThread(threadid, _this.callbackAIThreadMessage.bind(_this));

    _this.apihandler.unreadAIThreadMessageCount((msg) => {
      store.dispatch(actions.unreadAIThreadMessageCount(msg));
    });

    store.dispatch(actions.initThreadUnread(threadid));
  }

apiHandler.js
class ApiHandler {
  constructor(sock) {
    this.sock = sock;
    this.store = Store.getStore();

    this.userid = this.store.getState().profile.profile.userID;
    this.airunner = new airunner();
    this.threadRegisterMap = new Map();
  }
  isThreadRegistered(threadId){
    const exists = this.threadRegisterMap.has(threadId);
    return exists;
  }

  openAIThread(threadId, callback) {
    let _this = this;
    console.log('열린다*****************', threadId)
    console.log('열린다*****************', _this.threadRegisterMap)
    const isOpened = this.isThreadRegistered((threadId+''));
    console.log('열린다*****************', isOpened)
    
    if(!isOpened){
      let addr = 'hynix.client.' + threadId;

      let header = {
        client: 0,
        UUID: global.Common.getCookie('sessionkey'),
      };
      
      const handler = (msg) => {
        if (typeof callback === 'function') callback(threadId, msg);
      }
      
      _this.threadRegisterMap.set((threadId+''), true);
      _this.sock.register(addr, header, handler);
    }
  }
  
  closeAIThread(threadid, callback) {
    let _this = this;
    console.log('닫힌다*****************', threadid)
    console.log('닫힌다*****************', _this.threadRegisterMap)
    const isOpened = this.isThreadRegistered((threadid+''));
    console.log('닫힌다*****************', isOpened)
    
    if(isOpened){
          
      let header = {
        client: 0,
        UUID: global.Common.getCookie('sessionkey'),
      };

      let addr = 'hynix.client.' + threadid;

      _this.threadRegisterMap.delete(threadid+'');
      _this.sock.unregister(addr, header, (msg) => {
        if (typeof callback === 'function') callback(msg);
      });
    }
  }
