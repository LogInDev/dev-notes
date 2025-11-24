AIUThreadItem.js에서 x버튼을 누르면 모달창이 열리고 확인을 클릭하면 explosion이 실행되면서 deleteAITHread함수가 실행되는 아래처럼 THREAD2031라는 tp코드가 와서 처리하는거야.
  근데 일단 에러가 나느데 왜ㄴ나느거야?

delete하기=------ 700002921
aiThread.js:451 delete하기=------ (5) [{…}, {…}, {…}, {…}, {…}]
aiThread.js:452 delete하기=------ []
index.js:45 {uiSetting: {…}, profile: {…}, channel: {…}, messages: {…}, search: {…}, …}
installHook.js:1 Warning: Can't perform a React state update on an unmounted component. This is a no-op, but it indicates a memory leak in your application. To fix, cancel all subscriptions and asynchronous tasks in the componentWillUnmount method.
    in AIThreadItem (at AIThreadList.js:125)

  
case 'THREAD2031': // AI THREAD 삭제
          console.log('000000000', msg)
            const threadId = msg.channel_id + ''
            // store.dispatch(actions.deleteAIMessage(threadId));
            // store.dispatch(actions.deleteAIThread(threadId));

              try {
    store.dispatch(actions.deleteAIMessage(threadId));
    console.log('durl-pre-deleteAIThread---'); // 이 로그가 찍히나요?
  } catch (error) {
    console.error('Dispatch 중 에러 발생:', error); // 에러가 발생하면 이 로그가 찍힐 것입니다.
  }

              try {
    store.dispatch(actions.deleteAIThread(threadId));
    console.log('durl-post-deleteAIThread---'); // 이 로그가 찍히나요?
  } catch (error) {
    console.error('Dispatch 중 에러 발생:', error); // 에러가 발생하면 이 로그가 찍힐 것입니다.
  }

            console.log('durl-0------여기안와-----')
            let { dmchannels, currentChannel } = store.getState().aiThread;
            let { detail_selected } = store.getState().uiSetting;
            
            console.log('durl-0-----------', currentChannel)
            console.log('durl-0-----------', threadId)
            console.log('durl-0-----------', currentChannel + '' === threadId + '')
            if(currentChannel + '' === threadId + '' ){
              console.log('durl-0-----------')
              if(dmchannels.length > 0 ){
                console.log('durl-1-----------')
                let openThreadId = currentChannel === dmchannels[0].channel_id ? dmchannels[1].channel_id : dmchannels[0].channel_id
                this.openAIThreadPanel(dmchannels[0].channel_id);
              }else{
                if(detail_selected === 'assistant') store.dispatch(actions.clickDetailTabItem('info'));
              }
            }
            // this.requestAiThreadlDelete(threadId);
            break;


action에서 

  case ActionTypes.DELETE_AITHREAD:{
    let deleteThreadId = action.thread_id + '';
    let prevThreadList = state.dmchannels.filter(thread =>thread.channel_id !== deleteThreadId);
    let prevCurrentThreads = state.currentThreads.filter(threadId =>threadId !== deleteThreadId);

    console.log('delete하기=------', deleteThreadId)
    console.log('delete하기=------', prevThreadList)
    console.log('delete하기=------', prevCurrentThreads)

    return {
      ...state,
      dmchannels:prevThreadList,
      currentThreads:prevCurrentThreads
    }
  }
