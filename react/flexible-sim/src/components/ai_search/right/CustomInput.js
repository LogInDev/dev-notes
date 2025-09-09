import React, { Component } from 'react';

class CustomInput extends Component {
    render() {
        const { value, onClick } = this.props;

        return (
            <div className="datepicker-wrapper" onClick={onClick} ref={this.props.innerRef}>
                <input type="text" value={value} readOnly className="date-input" />
                <span className="calendar-icon">📅</span>
            </div>
        );
    }
}

// react-datepicker가 ref를 전달해주기 때문에 forwardRef처럼 innerRef 처리 필요
export default React.forwardRef((props, ref) => (
    <CustomInput {...props} innerRef={ref} />
));


