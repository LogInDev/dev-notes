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
                    {/* 1) 날짜 표시용 input (그냥 일반 input) */}
          <div className="datepicker-wrapper">
            <input
              type="text"
              value={moment(startDate).format('YYYY.MM.DD')}
              readOnly
              className="date-input has-calendar-bg"
            />
            {/* 아이콘을 요소로 쓰고 싶으면 아래 span 사용 (배경이미지 방식이면 필요 X) */}
            {/* <span className="calendar-icon">📅</span> */}
          </div>

          {/* 2) 항상 보이는 달력 (inline) */}
          <DatePicker
            selected={startDate}
            onChange={this.handleChange}
            dateFormat="YYYY.MM.DD"
            dateFormatCalendar="YYYY.MM"  // 헤더: 2025.09
            inline
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