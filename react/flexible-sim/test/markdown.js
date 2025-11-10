// 클래스 메서드로 추가
collectLabelMarkdown = (body) => {
  if (!body || !Array.isArray(body.row)) return '';

  const chunks = [];
  const dedup = new Set();

  const normalize = (s) => {
    if (!s) return '';
    let str = String(s).trim();
    if (!str) return '';
    // '|| ... ||' 형태(디스클레이머)는 제외
    if (str.startsWith('||') && str.endsWith('||')) return '';
    return str;
  };

  body.row.forEach(row => {
    (row.column || []).forEach(col => {
      if (col && col.type === 'label' && col.control && Array.isArray(col.control.text)) {
        col.control.text.forEach(t => {
          const n = normalize(t);
          if (n && !dedup.has(n)) {
            dedup.add(n);
            chunks.push(n);
          }
        });
      }
    });
  });

  // 마크다운 문단 구분
  return chunks.join('\n\n');
};

renderRich(rich, idx) {
  let lastMarks = this.renderReaction();
  this.isBot = false;
  let { body, header } = rich;
  if (!this.richOptionData[idx]) this.richOptionData.push({});
  if (header.to && header.to.uniquename) this.toUniqueName = header.to.uniquename;
  if (body && body.row instanceof Array) {
    let maxCount = body.row.length - 1;

    let isOnlyLabel = true;
    body.row.forEach(row => {
      row.column.forEach(column => {
        if (column.type !== 'label' && column.type !== 'hypertext') isOnlyLabel = false;
      });
    });

    const cssProps = {};
    const backgroundURI = (typeof body.backgroundURI === 'string' && body.backgroundURI.trim()) ? body.backgroundURI : "";
    if (backgroundURI !== "") {
      cssProps.backgroundImage = `url(${backgroundURI})`;
      cssProps.backgroundRepeat = 'no-repeat';
      cssProps.backgroundPosition = 'center';
      cssProps.backgroundSize = "cover";
    }
    if (typeof body.width === 'string' && body.width.trim()) {
      cssProps.width = body.width.indexOf('%') === -1 && body.width.toLowerCase().indexOf('px') === -1 ? body.width.toLowerCase() + '%' : body.width.toLowerCase();
    }
-   this.setState({markdownText : ''})
+   // ⚠️ 렌더 중 setState 금지. 여기서 label만 모아 캐시한다.
+   this._aggregatedMarkdown = this.collectLabelMarkdown(body);
+   this.isMarkdown = !!this._aggregatedMarkdown; // 버튼 노출 판단 용

    let rows = body.row.map((row, _idx) => {
      this.isLast = false;
      let rowClass;
      if(_idx === 0 && maxCount === 0){
        rowClass = ' rowfirst rowlast';
      }else if(_idx === 0){
        rowClass = ' rowfirst';
      }else if(_idx === maxCount){
        rowClass = ' rowlast';
        this.isLast = true;
      }else{
        rowClass = ' rowmiddle';
      }
      if (isOnlyLabel) {
        rowClass = ' richrowonlylable';
      }
      return this.renderRow(row, idx + '_' + _idx, idx, rowClass);
    });

    return (
      <div className="richbox flexible-airichbox" key={idx} style={cssProps}>
        {rows}
-       {isOnlyLabel && this.renderButton()}
+       {isOnlyLabel && this.renderButton()}
        {lastMarks}
      </div>
    );
  } else {
    return false;
  }
}


renderButton = () => {
  const imageBase = global.CONFIG.resource.image;
  const renderSource = (
    <button className="sourceBtn" style={{width: '75px'}}
      onClick={event => {
        this.props.handleSourcePopup(this.richnotification.header.source.chId);
      }}
      type="button"
    >
      <img src={`${imageBase}/aiassistant/icon_note.png`} alt="출처" />
      출처
    </button>
  )
  const renderMarkdownBtn = (
    <button
      className="sourceBtn"
      style={this.isSourceMsg ? {width: '100%'} : {}}
      onClick={event => {
-       this.props.handleMarkdownPopup(this.richnotification.content[0].body.row[0].column[1].control.text);
-       // this.props.handleMarkdownPopup(this.state.markdownText);
+       // label 타입에서 모은 통합 마크다운 사용
+       this.props.handleMarkdownPopup(this._aggregatedMarkdown || '');
      }}
      type="button"
    >
      <img src={`${imageBase}/aiassistant/icon_note.png`} alt="Markdown" />
      Markdown View
    </button>
  )
  return (
    <div style={{ display: 'flex', width: '183px', gap: '10px' }}>
      {this.isSourceMsg && renderSource}
      {this.isMarkdown && renderMarkdownBtn}
    </div>
  );
}
