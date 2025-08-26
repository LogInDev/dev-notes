// 메시지 클래스 컴포넌트 내부 메서드로 추가 (React 16.14)
renderGrid = (col) => {
    const ctl = col && col.control ? col.control : {};
    const cols = Math.max(1, ctl.columns || 1);
    const gap  = typeof ctl.gap === 'number' ? ctl.gap : 1;
    const rowH = ctl.rowHeight || 'minmax(32px, auto)';
    const cells = Array.isArray(ctl.cells) ? ctl.cells : [];

    return (
        <div
            className={cx('rn-grid', { inactive: ctl.active === false })}
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gridAutoRows: rowH,
                gap,
                background: gap ? '#e6e8eb' : undefined, // gap을 테이블 보더처럼 보이게
            }}
            role="grid"
            aria-colcount={cols}
        >
            {cells.map((cell, i) => {
                const r = Math.max(1, cell.r || 1);
                const c = Math.max(1, cell.c || 1);
                const w = Math.max(1, cell.w || 1);
                const h = Math.max(1, cell.h || 1);
                const align = cell.align || 'left';

                const style = {
                    gridRow:    `${r} / span ${h}`,
                    gridColumn: `${c} / span ${w}`,
                    background: cell.bg || '#fff',
                    color:      cell.fg || undefined,
                    fontWeight: cell.bold ? 600 : 400,
                };

                return (
                    <div
                        key={i}
                        className={cx('rn-gcell', align, { band: cell.variant === 'band' })}
                        style={style}
                        role="gridcell"
                        data-r={r}
                        data-c={c}
                        data-w={w}
                        data-h={h}
                        onClick={() => this.handleGridCellClick && this.handleGridCellClick(ctl.processid, cell, i)}
                    >
                        {cell.text}
                    </div>
                );
            })}
        </div>
    );
};
