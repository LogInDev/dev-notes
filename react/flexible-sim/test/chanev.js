
  openMyChannel() {
    if (!this.state.showMyChannel)
      this.setState({
        ...this.state,
        showMyChannel: true,
        showUnreadMessage: false,
      });
  }

  openUnreadMessages(channelid, isDm) {
    //if ( !this.state.showUnreadMessage )
    if (this.state.isIconHytube) {
      this.setState({
        ...this.state,
        showUnreadMessage: true,
        showMyChannel: false,
        unreadChannelid: channelid,
        isDm: isDm,
      });
    }
  }

  closeMyChannel() {
    this.setState({
      ...this.state,
      showMyChannel: false,
    });
  }

  closeUnreadMessage() {
    this.setState({
      ...this.state,
      showUnreadMessage: false,
    });
  }

  onKeyDown(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      if(this.props.activeAiTab) this.onClickSearchThread();
      else this.onClickSearch();
    }
  }

  onKeyUp(e) {
    if (e.keyCode !== 13) {
      if (e.target.value.trim().length === 0) {
        e.preventDefault();
        if(this.props.activeAiTab){
          this.isSearchAINoData = false;
          this.setState({ aithreads:[], searchtext: '' });
        }else{
          this.isSearchDMNoData = false;
          this.setState({ openInnerSearch: true, dmchannels: [], dmusers: { searchtext: '' } });
        }
      }
    }
  }

  setDMChannelData(list) {
    let resultList = [];
    if (list instanceof Array) {
      for (let i = 0; i < list.length; i++) {
        if (list[i].leave === undefined || list[i].leave === 'N') {
          resultList.push(list[i]);
        }
      }
    }

    if (resultList.length > 0) this.isSearchDMNoData = false;
    else this.isSearchDMNoData = true;

    this.setState({ dmchannels: resultList });
  }

  setAIThreadData(list) {
    let resultList = [];
    if (list instanceof Array) {
      for (let i = 0; i < list.length; i++) {
        if (list[i].leave === undefined || list[i].leave === 'N') {
          resultList.push(list[i]);
        }
      }
    }

    if (resultList.length > 0) this.isSearchAINoData = false;
    else this.isSearchAINoData = true;

    this.setState({ aithreads: resultList });
  }

  onClickSearch() {
    let _this = this;
    this.setState({
      ...this.state,
      favorite: this.state.favorite,
    });
    // _this.bizrunner.searchDMList(this.refs.dmsearchtext.value).then((msg) => {
    _this.airunner.searchDMList(this.refs.dmsearchtext.value).then((msg) => {

      _this.setDMChannelData(msg);
    });

    if (this.refs.dmsearchtext.value) {
      let data = {
        companyCode: undefined,
        deptID: -1,
        searchText: this.refs.dmsearchtext.value,
        startIndex: 0,
        orderField: undefined,
        orderAscDesc: undefined,
      };
      this.bizrunner.getUserList(data).then((res) => {
        let dmusers = {
          userlist: res.list,
          totalcount: res.count,
          searchtext: this.refs.dmsearchtext.value,
        };
        this.setState({ dmusers: dmusers });
      });
    } else {
      this.setState({ dmusers: { searchtext: '' } });
    }
  }

  onClickSearchThread=() => {
    if(this.refs.dmsearchtext.value === '' || this.refs.dmsearchtext.value === undefined) {
      this.cancelSearchAI();
      return;
    }
    this.airunner.searchThreadList(this.refs.dmsearchtext.value).then((msg) => {
        this.setAIThreadData(msg);
    });
    this.setState({ searchtext: this.refs.dmsearchtext.value });
  }

  onClickChannel(channelid) {
    if (this.props.channel.currentChannel + '' !== channelid + '') {
      Socket.getApi().openChannel(channelid);
    }
  }

  cancelSearchDM(channel_id, flag) {
    this.isSearchDMNoData = false;
    this.refs.dmsearchtext.value = '';
    this.refs.dmListRef.className = 'listWrap-hjm dmsearchlist';
    let data = this.state.dmchannels;
    let store = Store.getStore();
    this.setState(
      {
        ...this.state,
        openInnerSearch: true,
        dmchannels: [],
        dmusers: { searchtext: '' },
        favorite: this.state.favorite,
      },
      () => {
        if (flag !== undefined) {
          let api = Socket.getApi();
          if (flag) {
            api.addDMChannelByUniqueName(channel_id);
          } else {
            let sidx = this.props.channel.dmchannels.findIndex((c) => c.channel_id === channel_id);
            if (sidx < 0) {
              let didx = data.findIndex((d) => d.channel_id === channel_id);
              if (didx > -1) {
                store.dispatch(actions.addDMChannel(data[didx]));
              }
            }
            api.openChannel(channel_id);
          }
        }
      }
    );
  }

  cancelSearchAI = () => {
    this.isSearchAINoData = false;
    this.refs.dmsearchtext.value = '';
    // this.refs.aiListRef.className = 'listWrap-hjm dmsearchlist';
    this.setState({
        ...this.state,
        aithreads: [],
        searchtext:''
      });
  }

  addSearchUser(start_idx) {
    this.isSearchDMNoData = true;
    let data = {
      companyCode: undefined,
      deptID: -1,
      searchText: this.state.dmusers.searchtext,
      startIndex: start_idx,
      orderField: undefined,
      orderAscDesc: undefined,
    };
    this.bizrunner.getUserList(data).then((res) => {
      let dmusers = {
        userlist: this.state.dmusers.userlist.concat(res.list),
        totalcount: res.count,
        searchtext: this.state.dmusers.searchtext,
      };
      this.setState({ dmusers: dmusers });
    });
  }
  selectChannelList() {
    let store = Store.getStore();
    store.dispatch(actions.setSelectedMenu('CHANNEL'));
  }

  selectHiFeedbackChannelList() {
    let store = Store.getStore();
    store.dispatch(actions.setSelectedMenu('HIFEEDBACK'));
  }

  selectHytubeChannelList() {
    let store = Store.getStore();
    store.dispatch(actions.setSelectedMenu('HYTUBE'));
  }

  selectDMChannelList() {
    this.props.channel.dmchannels.dmchannels = {};
    this.refs.dmsearchtext.value = this.state.dmusers.searchtext;
    this.setState(
      {
        ...this.state,
        favorite: !this.state.favorite,
        dmusers:{searchtext: ''}
      },
      function () {
        !this.state.favorite
          ? Socket.getApi().selectDMChannelList('N')
          : Socket.getApi().selectDMFavoriteChannel('Y');
      }
    );
    if(this.props.activeAiTab) this.props.setAiThreadTab(false)
  }

  selectAIThreadList=()=> {
    let api = Socket.getApi();
    this.refs.dmsearchtext.value = this.state.searchtext;
    const { activeAiTab, detailSelected } = this.props;

    this.setState(
      {
        ...this.state,
        searchtext: ''
      },
      // function () {
      //   api.selectAIThreadList();
      // }
    );
    
    if(!activeAiTab){
      this.props.setAiThreadTab(true);
    }
    
    if(this.props.firstAiThreadId > 0 && this.props.currentThreadId === -1) {
      api.openAIThreadPanel(this.props.firstAiThreadId);
      if(detailSelected !== 'assistant'){
        this.props.clickDetailTabItem('assistant');
      }
    }

  }

  checkUnreadExists(type) {
    let result = false;

    if (type === "HiFeedback") {
      result = this.props.channel.hifeedbackchannel_unread > 0;
    } else if (type === "Hytube") {
      result = this.props.channel.hytubechannel_unread > 0;
    }

    return result;
  }

  renderTutorial() {
    let style = this.state.style;

    return (
      <div className="tutorial-left-wrap" style={style}>
        <div className="tutorial-left-msg">{this.language.BizWorksNoChannels}</div>
        <div className="tutorial-left-btn" onClick={this.openCreateChannel} />
      </div>
    );
  }

  deleteAIThread = (threadId) =>{
    // const { threadList, currentThreadId } = this.props;
    // const { openPopups } = this.state;

    // this.props.deleteAIThread(threadId);
    // if(openPopups.find(id => threadId === id)){
    //   this.closePopup(threadId)
    // }
    
    // if(currentThreadId === threadId ){
    //   if(threadList.length > 0 ){
    //     let openThreadId = currentThreadId === threadList[0].channel_id ? threadList[1].channel_id : threadList[0].channel_id
    //     Socket.getApi().openAIThreadPanel(openThreadId);
    //     this.scrollTop = 0;
    //   }else{
    //     if(this.props.detailSelected === 'assistant') this.props.clickDetailTabItem('info');
    //   }
    // }
    // Socket.getApi().requestAiThreadlDelete(threadId);
  }

  getThreadTitle = (id) =>{
    const { threadList } = this.props;
    const curThread = threadList.find(thread => thread.channel_id === id);
    if(curThread ){
      return curThread.aliasChannelName === undefined || curThread.aliasChannelName === null
          ? 'My 비서에게 물어보세요.'
          : curThread.aliasChannelName;
    }

    return 'My 비서에게 물어보세요.'
  }

  openAssistantPopup = (e, id) => {
    e.preventDefault();
    e.stopPropagation();

    const _this = this;

    console.log('============openAssistantPopup=======', id)
    this.title = this.getThreadTitle(id);
    console.log('============openAssistantPopup=======', _this.title)

    let api = Socket.getApi();
    api.openAIThreadPopup(id, null, (res) =>{
      const win = this.state.popupWindow[id];
      
      if (win && !win.closed) {
        try { 
          win.focus(); 
        } catch(e) {
          console.error('openAIPopup Error : ', e.message)
        }
        return;
      }
    });

    _this.setState(
      (prev) => {
        const exists = prev.openPopups.indexOf(id) >= 0;
        console.log('00000000', exists)
        const nextOpenPopups = exists
          ? prev.openPopups
          : prev.openPopups.concat(id);

        return {
          openPopups: nextOpenPopups,
          currentId: id,
        };
      },
      () => {
        console.log('★ setState 후 openPopups:', _this.state.openPopups);
      }
    );

    if(this.props.detailSelected === 'assistant') _this.props.clickDetailTabItem('info');

  }

  closePopup = (id) => {
    // const win = this.state.popupWindow[id];
    // if (win && !win.closed) {
    //   try {
    //     win.close();
    //   } catch (e) {
    //     console.error('closePopup Error : ', e.message);
    //   }
    // }

    // this.props.closeAIThreadPopup(id)

    // this.setState((s) => {
    //   if (!s.openPopups.includes(id) && !s.popupWindow[id]) {
    //   return null;
    //   }

    //   const nextMap = { ...s.popupWindow };
    //   delete nextMap[id];
    //   return {
    //     popupWindow: nextMap,
    //     openPopups: s.openPopups.filter((x) => x !== id),
    //   };
    // });
  };

  getPopupFeatures = (index) => {
    const baseLeft = 120;
    const baseTop = 80;
    const step = 30;
    return {
      width: this.popWidth,
      height: this.popHeight,
      left: baseLeft + index * step,
      top: baseTop + index * step,
      menubar: 'no', 
      toolbar: 'no'
    };
  };

  handleOpen = (id, win) => {
    this.setState((s) => ({
      popupWindow: { ...s.popupWindow, [id]: win },
    }), () => {
      try {
        let { image } = global.CONFIG.resource;
        const doc = win.document;
        const stylesheets = [
          `${image}/../css/ai_popup.css`,
          `${image}/../css/lineico/simple-line-icons.css`
        ];
        stylesheets.forEach(url => {
          const link = doc.createElement('link');
          link.rel = 'stylesheet';
          link.href = url;
          doc.head.appendChild(link);
        });
      } catch (e) {
        console.error('팝업 스타일 주입 실패:', e.message);
      }
    });
  };
