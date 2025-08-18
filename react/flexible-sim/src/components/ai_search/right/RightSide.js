import React, { Component } from 'react';
import { connect } from 'react-redux';
import { submitSearch } from '../../../store/actions/ai'; // ★ 추가
import './right.css';

class RightSide extends Component {
    render(){
        const { messages } = this.props;
        return (
            <section className="ai-search-right">
                <div className="search-result native-scroll">
                    {messages.length === 0 && <div className="msg msg--hint">왼쪽에서 검색 이력을 선택하세요.</div>}
                    {messages.map(m=>(
                        <div key={m.id || m.seq} className={`msg ${m.role==='user'?'msg--me':'msg--bot'}`}>
                            {m.text}
                        </div>
                    ))}
                </div>
                <div className="composer">
                    <input placeholder="(지금은 비활성)"/>
                    <button disabled>🔎</button>
                </div>
            </section>
        );
    }
}
export default connect(s=>({ messages:s.result.messages }))(RightSide);