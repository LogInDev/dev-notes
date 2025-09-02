import CopyableMessagePane from '../../common/CopyableMessagePane';

// ...
<CopyableMessagePane
  id="aiview"
  className="aiview"
  style={{ fontSize: 15, lineHeight: 1.5, color: font }}
  copiedText={this.language.copied}
  toastStyle={{ left: '38%', right: 0 }}
>
  <div>PopupID : {queryId}<br/></div>
  <br/>
  <div>
    안녕하세요 <br/>
    Pizza입니다. <br/>
    무엇을 도와드릴까요? <br/><br/>
    현재 테스트 진행중입니다.
  </div>
  <br/>
  {Array.from({ length: 80 }).map((_, i) => (
    <div key={i}>row {i + 1}</div>
  ))}
</CopyableMessagePane>


import CopyableMessagePane from '../common/CopyableMessagePane';

// ...
<CopyableMessagePane
  id={`aiviewMsg-${popupId}`}
  className="aiview"
  style={{ fontSize: 15, lineHeight: 1.5, color: '#111', height: '86%', overflowY: 'auto' }}
  copiedText={this.language.copied}
>
  <div>PopupID : {popupId}<br/></div>
  <br/>
  <div>
    안녕하세요 <br/>
    Pizza입니다. <br/>
    무엇을 도와드릴까요? <br/><br/>
    현재 테스트 진행중입니다.
  </div>
  <br/>
  {Array.from({ length: 80 }).map((_, i) => (
    <div key={i}>row {i + 1}</div>
  ))}
</CopyableMessagePane>

