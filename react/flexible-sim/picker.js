// DateFieldCompat046.jsx
import React, { Component } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function pad2(n){ return (n < 10 ? "0" : "") + n; }
function fmtYMD(d){ if(!d) return ""; return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function fmtDot(d){ if(!d) return ""; return `${d.getFullYear()}.${pad2(d.getMonth()+1)}.${pad2(d.getDate())}`; }
function addMonths(d, n){
  const dt = new Date(d.getFullYear(), d.getMonth() + n, 1);
  return dt;
}

export default class DateFieldCompat046 extends Component {
  constructor(props){
    super(props);
    const today = new Date();
    this.state = {
      isOpen: false,
      selected: null,                          // 실제 선택 날짜
      viewDate: new Date(today.getFullYear(), today.getMonth(), 1) // 달력에 보여줄 "월"
    };
    this.toggle = this.toggle.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.prevMonth = this.prevMonth.bind(this);
    this.nextMonth = this.nextMonth.bind(this);
  }

  toggle(open = !this.state.isOpen){
    // 팝업 열 때, 현재 선택 or 오늘 기준으로 보기 월 동기화
    this.setState(state => ({
      isOpen: open,
      viewDate: open
        ? (state.selected
            ? new Date(state.selected.getFullYear(), state.selected.getMonth(), 1)
            : new Date(new Date().getFullYear(), new Date().getMonth(), 1))
        : state.viewDate
    }));
  }

  handleSelect(date){
    this.setState({ selected: date, isOpen: false });
    // JSON 전송(프로세스 아이디 포함)
    if (this.props.onChangeJSON){
      this.props.onChangeJSON({
        status: "OK",
        message: "datepicker-change",
        data: {
          processid: this.props.processid || "CompleteDate",
          value: fmtYMD(date) // 서버에는 YYYY-MM-DD
        }
      });
    }
  }

  prevMonth(){ this.setState(s => ({ viewDate: addMonths(s.viewDate, -1) })); }
  nextMonth(){ this.setState(s => ({ viewDate: addMonths(s.viewDate,  1) })); }

  render(){
    const { isOpen, selected, viewDate } = this.state;
    const inputValue = selected ? fmtDot(selected) : ""; // 인풋 표시: YYYY.MM.DD
    const ym = `${viewDate.getFullYear()}.${pad2(viewDate.getMonth()+1)}`;
    const calendarKey = `${viewDate.getFullYear()}-${viewDate.getMonth()}`; // 보기 월 바뀔 때 리마운트

    return (
      <div className="df-wrap" style={{ position:"relative", display:"inline-block" }}>
        {/* 인풋 + 아이콘 */}
        <div className="df-input-wrap" onClick={()=>this.toggle(true)} style={{ position:"relative", display:"inline-flex", alignItems:"center" }}>
          <input className="df-input" value={inputValue} readOnly placeholder="YYYY.MM.DD"
                 style={{ padding:"6px 32px 6px 10px", height:30 }} />
          <button type="button" className="df-icon" aria-label="달력 열기"
                  style={{ position:"absolute", right:6, border:0, background:"transparent", cursor:"pointer" }}>
            📅
          </button>
        </div>

        {/* 팝업 달력 */}
        {isOpen && (
          <div className="df-pop" style={{
            position:"absolute", zIndex:9999, top:"110%", left:0,
            background:"#fff", boxShadow:"0 6px 18px rgba(0,0,0,0.12)", borderRadius:6, padding:8
          }}>
            {/* 커스텀 헤더 */}
            <div className="df-header" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, padding:"6px 6px 8px" }}>
              <button type="button" className="df-nav" onClick={this.prevMonth}
                      style={{ border:0, background:"transparent", cursor:"pointer", fontSize:16 }}>
                &lt;
              </button>
              <span className="df-ym" style={{ fontWeight:600 }}>{ym}</span>
              <button type="button" className="df-nav" onClick={this.nextMonth}
                      style={{ border:0, background:"transparent", cursor:"pointer", fontSize:16 }}>
                &gt;
              </button>
            </div>

            {/* DatePicker (inline) — 기본 헤더는 CSS로 숨김 */}
            <div className="df-cal">
              <DatePicker
                key={calendarKey}           // 보기 월 바뀔 때 강제 리마운트 → openToDate 반영
                inline                      // 팝업 안에 인라인 렌더
                selected={selected}         // 선택 날짜는 유지
                openToDate={viewDate}       // 이 월을 보여줘
                onChange={this.handleSelect}
                // 0.46은 dateFormat 토큰 쓰지 않아도 됨(인풋 표시를 우리가 직접 함)
                // 필요한 경우 minDate/maxDate 넣어도 OK
              />
            </div>

            {/* 바깥 클릭 닫기 필요하면 backdrop 추가해서 관리 */}
            <div style={{ textAlign:"right", paddingTop:6 }}>
              <button type="button" onClick={()=>this.toggle(false)} style={{ border:0, background:"transparent", cursor:"pointer" }}>닫기</button>
            </div>
          </div>
        )}

        {/* 기본 헤더 숨기기(0.46) */}
        <style>{`
          .df-pop .react-datepicker__header {
            display: none !important;
          }
        `}</style>
      </div>
    );
  }
}


{
  "status": "OK",
  "message": "datepicker-change",
  "data": {
    "processid": "CompleteDate",
    "value": "2025-09-09"
  }
}

/* ===== DateFieldCompat046 전용 보정 ===== */

/* 1) react-datepicker 기본 헤더/네비게이션 완전히 숨김 (우리는 커스텀 헤더 사용) */
.df-pop .react-datepicker__header { 
  display: none !important; 
}
.df-pop .react-datepicker__navigation--previous,
.df-pop .react-datepicker__navigation--next {
  display: none !important;
}

/* 2) 전역 스타일이 text-align:center 등으로 달력을 망치지 않도록 리셋 */
.df-pop,
.df-pop .react-datepicker {
  text-align: left !important;
}
.df-pop .react-datepicker * {
  box-sizing: border-box;
}

/* 3) 그리드가 달력처럼 보이도록 강제 정렬/사이즈 */
.df-pop .react-datepicker__month { 
  margin: 4px !important; 
}
.df-pop .react-datepicker__week { 
  display: flex !important; 
}
.df-pop .react-datepicker__day-name,
.df-pop .react-datepicker__day {
  display: inline-block !important;
  width: 2.2rem !important;
  height: 2.2rem !important;
  line-height: 2.2rem !important;
  text-align: center !important;
  margin: 0.166rem !important;
}

/* 4) 선택/hover(선택 사항, 있으면 더 달력처럼 보임) */
.df-pop .react-datepicker__day--selected,
.df-pop .react-datepicker__day--keyboard-selected {
  background: #2684ff !important;
  color: #fff !important;
  border-radius: 4px !important;
}
.df-pop .react-datepicker__day:hover {
  background: #e6f0ff !important;
  border-radius: 4px !important;
}



