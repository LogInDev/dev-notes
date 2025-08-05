import React, { Component } from 'react';
import './FlexMessagePanel.css';

const LANG = 'ko'; // 'en' 등 다국어 테스트 가능

class FlexMessagePanel extends Component {
    constructor(props) {
        super(props);
        this.state = this.makeInitialState(props.body);
    }

    // props.body가 바뀌면 state도 다시 초기화(실무에서 중요!)
    componentDidUpdate(prevProps) {
        if (this.props.body !== prevProps.body) {
            this.setState(this.makeInitialState(this.props.body));
        }
    }

    makeInitialState = body => {
        const state = {};
        if (!body || !body.content) return state;
        body.content.forEach(rowWrap => {
            (rowWrap.row || []).forEach(r => {
                (r.columns || []).forEach(col => {
                    if (col.type === 'select' || col.type === 'radio')
                        state[col.control.processId] = col.control.selected;
                    if (col.type === 'input')
                        state[col.control.processId] = col.control.value || '';
                    if (col.type === 'checkbox') {
                        if (Array.isArray(col.control.options)) {
                            state[col.control.processId] =
                                col.control.options.filter(o => o.checked).map(o => o.value);
                        } else {
                            state[col.control.processId] = col.control.checked || false;
                        }
                    }
                });
            });
        });
        return state;
    };

    handleChange = (processId, value) => {
        this.setState({ [processId]: value });
    };

    onProcess = (processId) => {
        alert(`[이벤트] processId: ${processId}\n값: ${JSON.stringify(this.state)}`);
    };

    getText = (txtObj) => {
        if (!txtObj) return '';
        if (typeof txtObj === 'string') return txtObj;
        return txtObj[LANG] || Object.values(txtObj)[0];
    };

    renderColumn = col => {
        const { type, flex, control } = col;
        switch (type) {
            case 'label':
                return (
                    <div className="flex-col" style={{ flex: flex || 1 }}>
                        <span className="flex-label">{this.getText(control.text)}</span>
                        {control.desc && <div className="flex-desc">{this.getText(control.desc)}</div>}
                    </div>
                );
            case 'image':
                return (
                    <div className="flex-col" style={{ flex: flex || 1 }}>
                        <img
                            src={control.src}
                            alt={this.getText(control.alt)}
                            className={control.avatar ? "flex-avatar" : "flex-image"}
                        />
                    </div>
                );
            case 'input':
                return (
                    <div className="flex-col" style={{ flex: flex || 1 }}>
                        {control.label && <span className="flex-label">{this.getText(control.label)}</span>}
                        <input
                            className="flex-input"
                            type="text"
                            placeholder={this.getText(control.placeholder)}
                            value={this.state[control.processId] || ''}
                            onChange={e => this.handleChange(control.processId, e.target.value)}
                        />
                    </div>
                );
            case 'select':
                return (
                    <div className="flex-col" style={{ flex: flex || 1 }}>
                        {control.label && <span className="flex-label">{this.getText(control.label)}</span>}
                        <select
                            className="flex-select"
                            value={this.state[control.processId]}
                            onChange={e => this.handleChange(control.processId, e.target.value)}
                        >
                            {control.options.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {this.getText(opt.label)}
                                </option>
                            ))}
                        </select>
                    </div>
                );
            case 'radio':
                if (control.options.some(opt => opt.image)) {
                    return (
                        <div className="flex-col flex-radio-img-group" style={{ flex: flex || 1 }}>
                            {control.label && <span className="flex-label">{this.getText(control.label)}</span>}
                            <div className="flex-radio-img-wrap">
                                {control.options.map(opt => (
                                    <label
                                        key={opt.value}
                                        className={`flex-radio-img-label${this.state[control.processId] === opt.value ? " selected" : ""}`}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <input
                                            type="radio"
                                            name={control.processId}
                                            value={opt.value}
                                            checked={this.state[control.processId] === opt.value}
                                            onChange={() => this.handleChange(control.processId, opt.value)}
                                            style={{ display: "none" }}
                                        />
                                        <img
                                            src={opt.image}
                                            alt={this.getText(opt.label)}
                                            className="flex-radio-img"
                                        />
                                        <span className="flex-radio-img-caption">{this.getText(opt.label)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    );
                }else{
                    return (
                        <div className="flex-col flex-radio-group" style={{ flex: flex || 1 }}>
                            {control.label && <span className="flex-label">{this.getText(control.label)}</span>}
                            <div className="flex-radio-wrap">
                                {control.options.map(opt => (
                                    <label key={opt.value} className="flex-radio-label">
                                        <input
                                            type="radio"
                                            name={control.processId}
                                            value={opt.value}
                                            checked={this.state[control.processId] === opt.value}
                                            onChange={() => this.handleChange(control.processId, opt.value)}
                                        />
                                        {this.getText(opt.label)}
                                    </label>
                                ))}
                            </div>
                        </div>
                    );
                }
            case 'checkbox':
                if (Array.isArray(control.options)) {
                    const checkedArr = this.state[control.processId] || [];
                    return (
                        <div className="flex-col flex-checkbox-group" style={{ flex: flex || 1 }}>
                            {control.label && <span className="flex-label">{this.getText(control.label)}</span>}
                            <div className="flex-checkbox-wrap">
                                {control.options.map(opt => (
                                    <label key={opt.value} className={`flex-checkbox-label${checkedArr.includes(opt.value) ? " checked" : ""}`}>
                                        <input
                                            type="checkbox"
                                            checked={checkedArr.includes(opt.value)}
                                            onChange={e => {
                                                const newArr = e.target.checked
                                                    ? [...checkedArr, opt.value]
                                                    : checkedArr.filter(v => v !== opt.value);
                                                this.handleChange(control.processId, newArr);
                                            }}
                                        />
                                        {this.getText(opt.label)}
                                    </label>
                                ))}
                            </div>
                        </div>
                    );
                } else {
                    // 단일 체크박스
                    return (
                        <div className="flex-col flex-checkbox-group" style={{ flex: flex || 1 }}>
                            <label className="flex-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={!!this.state[control.processId]}
                                    onChange={e => this.handleChange(control.processId, e.target.checked)}
                                />
                                {this.getText(control.label)}
                            </label>
                        </div>
                    );
                }
            case 'button':
                return (
                    <div className="flex-col flex-btn-col" style={{ flex: flex || 1 }}>
                        <button
                            className="flex-btn"
                            style={{
                                background: control.bgcolor || "#2784eb",
                                color: control.textcolor || "#fff"
                            }}
                            onClick={() => this.onProcess(control.processId)}
                        >
                            {this.getText(control.text)}
                        </button>
                    </div>
                );
            case 'date':
                return (
                    <div className="flex-col" style={{ flex: flex || 1 }}>
                        <span className="flex-label">{this.getText(control.label)}</span>
                        <input
                            className="flex-input"
                            type="date"
                            value={this.state[control.processId] || ''}
                            onChange={e => this.handleChange(control.processId, e.target.value)}
                            style={{ minWidth: 130, padding: 6, fontSize: 16 }}
                        />
                    </div>
                );
            default:
                return <div className="flex-col" style={{ flex: flex || 1 }}>지원 안함</div>;
        }
    };

    render() {
        const { body } = this.props;
        if (!body) return <div>no data</div>;
        const contentArr = Array.isArray(body.content) ? body.content : [];
        return (
            <div className="flex-card">
                {/* 헤더 */}
                <div className="flex-header">
                    <span>{body.header?.from}</span>
                    <span className="flex-arrow">&rarr;</span>
                    <span>{body.header?.to}</span>
                    <span className="flex-date">
                        {body.header?.timestamp && body.header.timestamp.substr(0, 10)}
                    </span>
                </div>
                {/* 본문 */}
                {contentArr.map((rowWrap, i) =>
                    <div key={i} className="flex-row">
                        {(Array.isArray(rowWrap.row) ? rowWrap.row : []).map((r, j) =>
                            (Array.isArray(r.columns) ? r.columns : []).map((col, k) => (
                                <React.Fragment key={k}>{this.renderColumn(col)}</React.Fragment>
                            ))
                        )}
                    </div>
                )}
            </div>
        );
    }
}

export default FlexMessagePanel;
