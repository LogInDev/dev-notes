AIThreadList.js 하위에 AIThreadItem.js를 우클릭하면 새창 팝업을 띄우는데

   return (
      <div style={{height:'calc(100% - 30px)'}}>
        <ul className="list2" id='aithread' ref={this.aithread}>
          {aithreadlist}
        </ul>

        {/* 리스트 우클릭 시 팝업 생성 */}
        {openPopups.map((id, i) => (
          <NewWindow
            key={id}
            title={this.title}
            features={this.getPopupFeatures(i)}
            onUnload={() => this.closePopup(id)}
            onOpen={(win) => this.handleOpen(id, win)}  
          >
            <Provider store={Store.getStore()}>
              <AssistantPopup
                popupId={String(id)}
                popupWindow={popupWindow[id]}
                height={this.popHeight}
                threadTitle={this.title}
              />
            </Provider>
          </NewWindow>  
        ))
      }


AssistantPopup.js 하위에 렌더링할 컴포넌트 중에 

                <AIPopupMessageList
                  channelinfo={this.props.infosummary}
                  channelid={popupId}
                  isPopup={true}
                  messages={threadMsg}
                  userid={this.props.profile.userID}
                  companycode={this.props.profile.companyCode}
                  action={this.props.action}
                  onAddMention={this.setMentionToInputBox.bind(this)}
                  openPopupFlag={false}
                  openMessageTerm={this.openMessageTerm.bind(this)}
                  popupDocument={this.props.popupWindow && this.props.popupWindow.document}
                  isLoading={isLoading}
                  fontcolor={'#111'
                    // this.props.infosummary.channel_set !== undefined &&
                    // this.props.infosummary.channel_set.CHANNELID !== -1
                    //   ? this.props.infosummary.channel_set.COLOR_FONT
                    //   : global.CONFIG.other.fontColor
                  }
                  handleSourcePopup={this.openSourcePopup}
                  handleMarkdownPopup={this.openMarkdownPopup}
                  thr
이게 있고 

그 하위에 AIMessageItem.js 가 있는데

거기에 우클릭하면 토스트 메시지가 나오는 이벤트가 있어


  onMouseDownTerm(e) {
    let rightclick;
    if (e.which) rightclick = e.which === 3;
    else if (e.button) rightclick = e.button === 2;

    if (rightclick) {
      e.preventDefault();
      e.stopPropagation();
      let copytext = this.props.message.content.trim() + '';
      if (this.is_ie()) {
        window.clipboardData.setData('Text', copytext);
      } else {
        let doc = document;
        if(this.props.popupDocument){
          const el = this.refs.termcopylayer4;
          if (!el) return;
         
          doc = this.props.popupDocument || el.ownerDocument;
        }
        let textarea = doc.createElement('textarea');
        textarea.textContent = copytext;
        doc.body.appendChild(textarea);

        let selection = doc.getSelection();
        let range = doc.createRange();
        range.selectNode(textarea);

        selection.removeAllRanges();
        selection.addRange(range);

        doc.execCommand('copy');
        selection.removeAllRanges();

        doc.body.removeChild(textarea);
      }
      console.log('==================', this.props.popupDocument)
      if(this.props.popupDocument){
        this.refs.termcopylayer4.className = 'termcopylayer4 active';
        setTimeout(() => {
          this.refs.termcopylayer4.className = 'termcopylayer4 fadeout';
        }, 1000);
      }else{
        this.refs.termcopylayer3.className = 'termcopylayer3 active';
        setTimeout(() => {
          this.refs.termcopylayer3.className = 'termcopylayer3 active fadeout';
        }, 1000);
      }
    }
  }

          {this.props.isAiPopup
            ? (
              <div className="termcopylayer4 fadeout" ref="termcopylayer4">
                <span className="termcopymsg">{this.language.copied}</span>
              </div>
            )
            : (
              <div className="termcopylayer3 active fadeout" ref="termcopylayer3">
                <span className="termcopymsg">{this.language.copied}</span>
              </div>
            )
          }
         




근데 이게 AIThreadList에서 우클릭해서 새창 팝업 띄울 때 새창팝업에 도 해당 토스트 메시이지가 생기는거야. 

뭔가 우클릭이 버블링되는지 원인을 모르겠는데 왜 그런거야? 새창팝업 띄우자마자 해당 팝업에 토스트 메시지가 생겨. 근데 웃긴건


.termcopylayer3 { position: fixed; bottom: 100px; right:-34%; width: calc(100% - 50px);  text-align: center; z-index: 9999;}
.termcopylayer3.active { visibility: visible; opacity: 1; transition: 3s all ease; }
.termcopylayer3.active.fadeout { visibility: hidden; opacity: 0; }



여기 ㅣcss에서 transition: 3s all ease; 를 지우면 안생겨

토스트 메시지를 서서히 나타냈다가 사라지게할 효과로 저건 필요한데 왜그런거야?
