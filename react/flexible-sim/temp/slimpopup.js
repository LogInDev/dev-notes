// AssistantPopup.render() 내부
                <AIPopupMessageList
                  channelinfo={this.props.infosummary}
                  channelid={popupId}
                  isPopup={true}
                  messages={threadMsg}
                  userid={this.props.profile.userID}
                  companycode={this.props.profile.companyCode}
                  action={this.props.action}
                  onAddMention={this.setMentionToInputBox.bind(this)}
                  openDetail={this.openDetail}
                  openPopupFlag={false}
                  openMessageTerm={this.openMessageTerm.bind(this)}
+                 popupDocument={this.props.popupWindow && this.props.popupWindow.document}
+                 popupId={popupId}
                  fontcolor={
                    this.props.infosummary.channel_set !== undefined &&
                    this.props.infosummary.channel_set.CHANNELID !== -1
                      ? this.props.infosummary.channel_set.COLOR_FONT
                      : global.CONFIG.other.fontColor
                  }
                />
                
                


- <div id="message3" key="message3" className="chatlistin" ref="chatlistin3">
+ <div
+   id={`aiviewMsg-${this.props.popupId}`}
+   data-mid="message3"             // (옵션) 필요하면 유지용
+   className="chatlistin"
+   ref="chatlistin3"
+ >

- import slimscroll from 'util/slimscroll';
+ import slimscroll from 'util/slimscroll-fixed';

// ...
moveScroll(height) {
-  this.slimscroll = new slimscroll({
-    height: '100%',
-    idSelector: '#message3',
-    scrollTo: height || '100000'
-  });
-  this.slimscroll.init();
+  const el = this.refs.chatlistin3;
+  if (!el) return;
+  // 팝업 문서 우선, 없으면 ownerDocument
+  const doc = (this.props.popupDocument) || (el.ownerDocument);
+  // 최초 래핑(이미 래핑되어 있으면 생략됨)
+  if (!this._inited) {
+    const init = new slimscroll({ height: '100%', doc }, [el]); // 요소 배열 + doc
+    init.init();
+    this._inited = true;
+  }
+  // 스크롤 이동
+  const scroller = new slimscroll({ scrollTo: height || '100000', doc }, [el]);
+  scroller.init();

  this.prevScrollHeight = this.refs.chatlistin3.scrollHeight;
  this.precurrentScrollTop = this.refs.chatlistin3.scrollTop;
  // ...
}
