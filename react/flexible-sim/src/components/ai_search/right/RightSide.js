import React, { Component } from 'react';
import { connect } from 'react-redux';
import { submitSearch } from '../../../store/actions/ai'; // ★ 추가
import './right.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';
import CustomInput from './CustomInput';

class RightSide extends Component {
    constructor(props) {
        super(props);
        this.state = {
            startDate: moment() // 기본 선택 날짜
        };
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(date) {
        this.setState({ startDate: date });
        // 필요하다면 Redux dispatch도 가능
        // this.props.dispatch(submitSearch({ date }));
    }
    render(){
        const { messages } = this.props;
        const { startDate } = this.state;
        return (
            <section className="ai-search-right">
                <div className="search-result native-scroll">
                    <DatePicker
                        selected={startDate}
                        onChange={this.handleChange}
                        dateFormat="YYYY-MM-DD"
                        dateFormatCalendar="YYYY.MM"
                        className="date-input"
                        customInput={<CustomInput />}
                    />

                    {messages.length === 0 && (
                        <div className="msg msg--hint">왼쪽에서 검색 이력을 선택하세요.</div>
                    )}
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