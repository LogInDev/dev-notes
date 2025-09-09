// DateField.jsx
import React, { Component } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// YYYY-MM-DD 포맷
function fmtYMD(d) {
  if (!d) return "";
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}
// YYYY.MM.DD (입력창 표시용)
function fmtDot(d) {
  if (!d) return "";
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}.${m}.${day}`;
}

const CalendarInput = React.forwardRef(({ value, onClick, placeholder }, ref) => (
  <div className="dp-input-wrap">
    <input
      ref={ref}
      className="dp-input"
      value={value || ""}
      onClick={onClick}
      readOnly
      placeholder={placeholder || "날짜 선택"}
    />
    <button type="button" className="dp-icon" onClick={onClick} aria-label="달력 열기">📅</button>
  </div>
));

export default class DateField extends Component {
  constructor(props) {
    super(props);
    this.state = { selected: null };
    this.renderHeader = this.renderHeader.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  // 헤더: YYYY.MM + < >
  renderHeader({ date, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) {
    const yyyy = date.getFullYear();
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    return (
      <div className="dp-header">
        <button type="button" className="dp-nav" onClick={decreaseMonth} disabled={prevMonthButtonDisabled}>&lt;</button>
        <span className="dp-ym">{yyyy}.{mm}</span>
        <button type="button" className="dp-nav" onClick={increaseMonth} disabled={nextMonthButtonDisabled}>&gt;</button>
      </div>
    );
  }

  handleChange(date) {
    this.setState({ selected: date });
    // JSON으로 상위에 전달 (processid는 prop으로 받는다고 가정)
    if (this.props.onChangeJSON) {
      this.props.onChangeJSON({
        status: "OK",
        message: "datepicker-change",
        data: {
          processid: this.props.processid || "CompleteDate",
          value: fmtYMD(date) // 서버로는 YYYY-MM-DD
        }
      });
    }
  }

  render() {
    const { selected } = this.state;
    return (
      <DatePicker
        selected={selected}
        onChange={this.handleChange}
        dateFormat="yyyy.MM.dd"                // 인풋 표시 포맷
        customInput={<CalendarInput placeholder={this.props.placeholder} />}
        renderCustomHeader={this.renderHeader} // 커스텀 헤더 (YYYY.MM + < >)
        placeholderText="날짜 선택"
      />
    );
  }
}

/* datefield.css */
.dp-input-wrap { position: relative; display: inline-flex; align-items: center; }
.dp-input { padding: 6px 32px 6px 10px; height: 30px; line-height: 30px; }
.dp-icon {
  position: absolute; right: 6px; border: 0; background: transparent; cursor: pointer;
  height: 24px; width: 24px; font-size: 16px; line-height: 24px;
}
.dp-header { display:flex; align-items:center; justify-content:center; gap:12px; padding:6px; }
.dp-ym { font-weight:600; }
.dp-nav { border:0; background:transparent; cursor:pointer; font-size:16px; }
.dp-nav:disabled { opacity: .4; cursor:not-allowed; }


// Message 컴포넌트 안
renderColumn = (column) => {
  switch (column.type) {
    case "datepicker":
      return (
        <DateField
          processid={column.control && column.control.processid}
          placeholder="YYYY.MM.DD"
          onChangeJSON={(payload) => {
            // 여기서 소켓/HTTP로 서버에 전송
            // socket.emit("CHAT/CONTROL", payload);
            console.log("SEND:", payload);
          }}
        />
      );

    // ...다른 타입
    default:
      return null;
  }
};

{
  "status": "OK",
  "message": "datepicker-change",
  "data": {
    "processid": "CompleteDate",
    "value": "2025-08-19"
  }
}



