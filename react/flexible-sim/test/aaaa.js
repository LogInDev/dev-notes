transformDataToMarkdown = (rich) =>{
    const allAggregatedChunks = [];
    const masterDedup = new Set(); 
    const normalize = (s) => {
      if (!s) return '';
      let str = String(s).trim();
      if (!str) return '';
      if (str.includes('해당 답변은 AI가 생성한 답변으로, 정확하지 않을 수 있습니다')) return ''; 
      return str;
    };
    const dedent = (s) => {
      const lines = s.replace(/\r/g, '').split('\n');
      const indents = lines
      .filter(l => l.trim().length)
      .map(l => l.match(/^\s*/)[0].length);
      const min = indents.length ? Math.min(...indents) : 0;
      return lines.map(l => l.slice(min)).join('\n').trim();
    };

    rich.forEach((content) => {
      let { body } = content;
      const chunks = [];
      
      body.row.forEach((row, _idx) => {
        (row.column || []).forEach(col => {
          if (col && col.type === 'label' && col.control && Array.isArray(col.control.text)) {
            // col.control.text.forEach(t => {
            const t = col.control.text[0];
            const n = normalize(t);
            if (n && !masterDedup.has(n)) {
              masterDedup.add(n);
              chunks.push(n);
            }
            // });
          }
        });
      });

      allAggregatedChunks.push(...chunks);
    });

    return dedent(allAggregatedChunks.join('\n\n'))
      .replace(/\u00A0|\u3000/g, ' ')
      .replace(/^\s{2,}/gm, ''); 
  }
