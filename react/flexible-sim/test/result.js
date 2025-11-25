열린거 또 s열리게 MAp으로 관리하고 있는데 뭔가 열어도 map에 적용이 안되는 경우가 있는거 같아. 정확하게 동작되게 수정해

class ApiHandler {
  constructor(sock) {
    this.sock = sock;
    this.store = Store.getStore();

    this.userid = this.store.getState().profile.profile.userID;
    this.airunner = new airunner();
    this.threadRegisterMap = new Map();
  }
  openAIThread(threadId, callback) {
    let _this = this;
    const isOpened = this.isThreadRegistered(threadId);
    
    if(!isOpened){
      let addr = 'hynix.client.' + threadId;

      let header = {
        client: 0,
        UUID: global.Common.getCookie('sessionkey'),
      };
      
      const handler = (msg) => {
        if (typeof callback === 'function') callback(threadId, msg);
      }
      
      _this.threadRegisterMap.set(threadId, true);
      _this.sock.register(addr, header, handler);
    }
  }
  
  closeAIThread(threadid, callback) {
    let _this = this;
    const isOpened = this.isThreadRegistered(threadid);
    
    if(isOpened){
          
      let header = {
        client: 0,
        UUID: global.Common.getCookie('sessionkey'),
      };

      let addr = 'hynix.client.' + threadid;

      this.threadRegisterMap.delete(threadid);
      _this.sock.unregister(addr, header, (msg) => {
        if (typeof callback === 'function') callback(msg);
      });
    }
  }

}
