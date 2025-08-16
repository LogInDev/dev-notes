import React, { Component } from 'react';
import { connect } from 'react-redux';
import { submitSearch } from '../../../store/actions/ai'; // ★ 추가
import './right.css';

class RightSide extends Component {
    state = { value: '' };

    handleSubmit = () => {
        const keyword = (this.state.value || '').trim();
        if (!keyword) return;
        this.props.submitSearch(keyword);
        // 필요하면 입력값 초기화 주석 해제
        // this.setState({ value: '' });
    };

    render(){
        const { messages } = this.props;
        const { value } = this.state;

        return (
            <section className="ai-search-right">
                {/* 검색 결과 영역 */}
                <div className="search-result native-scroll">
                    {messages.map(m=>(
                        <div key={m.id || m.seq} className="msg msg--bot">{m.text}</div>
                    ))}
                </div>

                {/* 하단 입력 + 검색 아이콘 버튼 */}
                <div className="composer">
                    <div className="composer__box">
                        <input
                            className="composer__input"
                            placeholder="검색어 입력…"
                            value={value}
                            onChange={(e)=>this.setState({ value: e.target.value })}
                            onKeyDown={(e)=>{ if(e.key === 'Enter') this.handleSubmit(); }}
                        />
                        <button
                            type="button"
                            className="composer__search"
                            onClick={this.handleSubmit}
                            aria-label="검색"
                            title="검색"
                        >
                            🔎
                        </button>
                    </div>
                </div>
            </section>
        );
    }
}

export default connect(
    s => ({ messages: s.result.messages }),
    { submitSearch }                          // ★ 액션 바인딩
)(RightSide);
